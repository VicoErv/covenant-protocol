import sys
import os
import json
from web3 import Web3
from web3.middleware import geth_poa_middleware

RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:8545")
PRIVATE_KEY = os.getenv("PRIVATE_KEY") # Required for transactions
MULTISIG_ADDRESS = os.getenv("MULTISIG_ADDRESS")
OPTIMISTIC_ADDRESS = os.getenv("OPTIMISTIC_ADDRESS")
JURY_ADDRESS = os.getenv("JURY_ADDRESS")

web3 = Web3(Web3.HTTPProvider(RPC_URL))
web3.middleware_onion.inject(geth_poa_middleware, layer=0)

if not PRIVATE_KEY:
    print("Error: PRIVATE_KEY env var required")
    sys.exit(1)

account = web3.eth.account.from_key(PRIVATE_KEY)
print(f"Using account: {account.address}")

def load_abi(name):
    # Try different paths
    paths = [
        f"../out/{name}.sol/{name}.json", 
        f"out/{name}.sol/{name}.json",
        f"../src/resolvers/{name}.sol/{name}.json" # Not correct build path usually, but safe fallback
    ]
    for path in paths:
        if os.path.exists(path):
            with open(path, "r") as f:
                return json.load(f)["abi"]
    raise Exception(f"ABI for {name} not found")

def send_tx(func):
    tx = func.build_transaction({
        'from': account.address,
        'nonce': web3.eth.get_transaction_count(account.address),
        'gas': 2000000,
        'gasPrice': web3.eth.gas_price
    })
    signed = web3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed.raw_transaction)
    print(f"Tx sent: {tx_hash.hex()}")
    receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Status: {receipt['status']}")

def multisig_propose(pid, outcome):
    contract = web3.eth.contract(address=MULTISIG_ADDRESS, abi=load_abi("MultisigResolver"))
    print(f"Multisig Proposing: PID {pid} -> {outcome}")
    send_tx(contract.functions.proposeResolution(int(pid), outcome == "true"))

def multisig_confirm(tx_id):
    contract = web3.eth.contract(address=MULTISIG_ADDRESS, abi=load_abi("MultisigResolver"))
    print(f"Multisig Confirming: TxID {tx_id}")
    send_tx(contract.functions.confirmResolution(int(tx_id)))

def optimistic_propose(pid, outcome):
    contract = web3.eth.contract(address=OPTIMISTIC_ADDRESS, abi=load_abi("OptimisticResolver"))
    print(f"Optimistic Proposing: PID {pid} -> {outcome}")
    bond = contract.functions.BOND_AMOUNT().call()
    
    func = contract.functions.proposeOutcome(int(pid), outcome == "true")
    # Need to append value to the build_transaction call, handled via kwarg in wrapper? 
    # Let's inline send_tx logic here for payable
    tx = func.build_transaction({
        'from': account.address,
        'value': bond,
        'nonce': web3.eth.get_transaction_count(account.address),
        'gas': 2000000,
        'gasPrice': web3.eth.gas_price
    })
    signed = web3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed.raw_transaction)
    print(f"Tx sent: {tx_hash.hex()}")
    receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Status: {receipt['status']}")

def main():
    if len(sys.argv) < 3:
        print("Usage: python resolver_tool.py <command> <args...>")
        print("Commands:")
        print("  multisig-propose <pid> <true/false>")
        print("  multisig-confirm <tx_id>")
        print("  optimistic-propose <pid> <true/false>")
        sys.exit(1)
        
    cmd = sys.argv[1]
    
    if cmd == "multisig-propose":
        multisig_propose(sys.argv[2], sys.argv[3])
    elif cmd == "multisig-confirm":
        multisig_confirm(sys.argv[2])
    elif cmd == "optimistic-propose":
        optimistic_propose(sys.argv[2], sys.argv[3])
    else:
        print(f"Unknown command: {cmd}")

if __name__ == "__main__":
    main()
