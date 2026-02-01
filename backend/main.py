from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal, init_db, Proposal, User
from fastapi.middleware.cors import CORSMiddleware
from minio import Minio
import hashlib
import io
import os
import threading
from indexer import start_indexer

app = FastAPI()

# MinIO Client
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "proofs")

minio_client = Minio(
    MINIO_ENDPOINT.replace("http://", "").replace("https://", ""),
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
def startup_event():
    init_db()
    
    # Ensure bucket exists
    if not minio_client.bucket_exists(MINIO_BUCKET):
        minio_client.make_bucket(MINIO_BUCKET)
        
    # Set public policy (Anonymous Read)
    # This allows viewing files via http://localhost:9000/proofs/{hash}
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"AWS": ["*"]},
                "Action": ["s3:GetBucketLocation", "s3:ListBucket"],
                "Resource": [f"arn:aws:s3:::{MINIO_BUCKET}"]
            },
            {
                "Effect": "Allow",
                "Principal": {"AWS": ["*"]},
                "Action": ["s3:GetObject"],
                "Resource": [f"arn:aws:s3:::{MINIO_BUCKET}/*"]
            }
        ]
    }
    import json
    try:
        minio_client.set_bucket_policy(MINIO_BUCKET, json.dumps(policy))
        print(f"Successfully set public policy for bucket {MINIO_BUCKET}", flush=True)
    except Exception as e:
        print(f"Error setting bucket policy: {e}", flush=True)
        
    # Start indexer in a separate thread
    indexer_thread = threading.Thread(target=start_indexer, daemon=True)
    indexer_thread.start()

@app.get("/")
def read_root():
    return {"message": "Covenant Backend API"}

@app.get("/feed")
def get_feed(db: Session = Depends(get_db)):
    return db.query(Proposal).all()

@app.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    users = db.query(User).all()
    users.sort(key=lambda u: int(u.reputation), reverse=True)
    return users[:10]

@app.post("/upload")
async def upload_proof(file: UploadFile = File(...)):
    # Read file content
    content = await file.read()
    
    # Calculate SHA-256 hash
    file_hash = hashlib.sha256(content).hexdigest()
    
    # Upload to MinIO
    content_stream = io.BytesIO(content)
    minio_client.put_object(
        MINIO_BUCKET,
        file_hash,
        content_stream,
        length=len(content),
        content_type=file.content_type
    )
    
    # The URL for viewing is through MinIO endpoint (public in dev)
    # Note: Use localhost for frontend access if running locally, or minio:9000 for docker-to-docker
    return {
        "info": f"file '{file.filename}' saved in MinIO", 
        "hash": f"0x{file_hash}",
        "url": f"http://localhost:9000/{MINIO_BUCKET}/{file_hash}"
    }
