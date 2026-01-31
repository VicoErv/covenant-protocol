from sqlalchemy import create_engine, Column, Integer, String, Boolean, Float
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DB_PATH = os.getenv("DB_PATH", "./proposals.db")
SQL_ALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(SQL_ALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Proposal(Base):
    __tablename__ = "proposals"

    id = Column(Integer, primary_key=True, index=True)
    chain_id = Column(Integer, index=True) # On-chain Proposal ID
    submitter = Column(String, index=True)
    details = Column(String)
    requested_amount = Column(String) # Stored as string to handle uint256
    status = Column(Integer) # Enum value
    proof = Column(String, nullable=True)
    approval_count = Column(Integer, default=0)
    resolved = Column(Boolean, default=False)
    success = Column(Boolean, nullable=True)

class User(Base):
    __tablename__ = "users"
    
    address = Column(String, primary_key=True, index=True)
    reputation = Column(String, default="0")
    is_member = Column(Boolean, default=False)

def init_db():
    Base.metadata.create_all(bind=engine)
