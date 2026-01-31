import asyncio
import json
import os
import time
from web3 import Web3
from sqlalchemy.orm import Session
from database import SessionLocal, Proposal, User, engine

# Configuration
RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:8545")
BUILDER_ENGINE_ADDRESS = Web3.to_checksum_address(os.getenv("BUILDER_ENGINE_ADDRESS")) if os.getenv("BUILDER_ENGINE_ADDRESS") else None
REPUTATION_LEDGER_ADDRESS = Web3.to_checksum_address(os.getenv("REPUTATION_LEDGER_ADDRESS")) if os.getenv("REPUTATION_LEDGER_ADDRESS") else None

if not BUILDER_ENGINE_ADDRESS:
    print("Warning: BUILDER_ENGINE_ADDRESS not set")
    
if not REPUTATION_LEDGER_ADDRESS:
    print("Warning: REPUTATION_LEDGER_ADDRESS not set")

web3 = Web3(Web3.HTTPProvider(RPC_URL))

def load_abi(name):
    path = f"../out/{name}.sol/{name}.json"
    if not os.path.exists(path):
        # Fallback for docker/deployment structure
        path = f"out/{name}.sol/{name}.json"
    
    with open(path, "r") as f:
        data = json.load(f)
        return data["abi"]

def get_contract(name, address):
    if not address:
        print(f"Contract {name} address is missing", flush=True)
        return None
    print(f"Loading contract {name} at {address}", flush=True)
    chk_address = Web3.to_checksum_address(address)
    abi = load_abi(name)
    return web3.eth.contract(address=chk_address, abi=abi)

def process_events(db: Session):
    builder_engine = get_contract("BuilderEngine", BUILDER_ENGINE_ADDRESS)
    rep_ledger = get_contract("ReputationLedger", REPUTATION_LEDGER_ADDRESS)
    
    if not builder_engine:
        return

    # In a real indexer, we track last_processed_block in DB or file.
    # Here we just poll latest blocks for MVP simplicity or use filter.
    # Let's use get_logs with a simple loop for now.
    
    current_block = web3.eth.block_number
    # For MVP, just looking at recent history or simpler: use event filters
    # Proper indexing is complex. I'll implement a simple "Listen Loop"
    
    # 1. ProposalSubmitted
    logs = builder_engine.events.ProposalSubmitted().get_logs(from_block=0)
    for log in logs:
        handle_proposal_submitted(db, log)
        
    # 2. ProposalApproved
    logs = builder_engine.events.ProposalApproved().get_logs(from_block=0)
    for log in logs:
        handle_proposal_approved(db, log)

    # 3. ProposalFunded
    logs = builder_engine.events.ProposalFunded().get_logs(from_block=0)
    for log in logs:
        handle_proposal_funded(db, log)
        
    # 4. ProofSubmitted
    logs = builder_engine.events.ProofSubmitted().get_logs(from_block=0)
    for log in logs:
        handle_proof_submitted(db, log)

    # 5. ProposalResolved
    logs = builder_engine.events.ProposalResolved().get_logs(from_block=0)
    for log in logs:
        handle_proposal_resolved(db, log)

    # Reputation Updates
    if rep_ledger:
        logs = rep_ledger.events.ReputationUpdated().get_logs(from_block=0)
        for log in logs:
            handle_reputation_updated(db, log)

def handle_proposal_submitted(db: Session, log):
    pid = log.args.id
    submitter = log.args.submitter
    # We might need to fetch details from contract if not sufficiently in event
    # Event has: id, submitter, amount.
    # Missing: details string.
    # Fetch from contract
    builder_engine = get_contract("BuilderEngine", BUILDER_ENGINE_ADDRESS)
    p_data = builder_engine.functions.proposals(pid).call() 
    # struct Proposal { id, submitter, details, requestedAmount, status, ... }
    
    proposal = db.query(Proposal).filter(Proposal.chain_id == pid).first()
    if not proposal:
        proposal = Proposal(
            chain_id=pid,
            submitter=submitter,
            details=p_data[2], # details string
            requested_amount=str(p_data[3]),
            status=p_data[4], # status enum
            approval_count=p_data[6]
        )
        db.add(proposal)
    else:
        # Update just in case
        proposal.status = p_data[4]
    
    db.commit()

def handle_proposal_approved(db: Session, log):
    pid = log.args.id
    proposal = db.query(Proposal).filter(Proposal.chain_id == pid).first()
    if proposal:
        proposal.approval_count += 1
        db.commit()

def handle_proposal_funded(db: Session, log):
    pid = log.args.id
    proposal = db.query(Proposal).filter(Proposal.chain_id == pid).first()
    if proposal:
        proposal.status = 1 # Funded
        db.commit()

def handle_proof_submitted(db: Session, log):
    pid = log.args.id
    proof = log.args.proof
    proposal = db.query(Proposal).filter(Proposal.chain_id == pid).first()
    if proposal:
        proposal.proof = proof
        proposal.status = 2 # Delivered
        db.commit()

def handle_proposal_resolved(db: Session, log):
    pid = log.args.id
    success = log.args.success
    proposal = db.query(Proposal).filter(Proposal.chain_id == pid).first()
    if proposal:
        proposal.resolved = True
        proposal.success = success
        proposal.status = 3 if success else 4 # Completed or Failed
        db.commit()

def handle_reputation_updated(db: Session, log):
    user_addr = log.args.user
    new_amount = log.args.newAmount
    
    user = db.query(User).filter(User.address == user_addr).first()
    if not user:
        user = User(address=user_addr, reputation=str(new_amount))
        db.add(user)
    else:
        user.reputation = str(new_amount)
    db.commit()

def start_indexer():
    print("Indexer started...", flush=True)
    while True:
        try:
            db = SessionLocal()
            process_events(db)
            db.close()
        except Exception as e:
            print(f"Indexer error: {e}", flush=True)
        time.sleep(5) # Poll every 5s

if __name__ == "__main__":
    start_indexer()
