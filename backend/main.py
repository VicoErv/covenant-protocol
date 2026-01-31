from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal, init_db, Proposal, User
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import threading
from indexer import start_indexer

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, allowing all. Can be restricted to ["http://localhost:3000"]
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
    # Sort by rep descending. Note: Storing rep as string for safety, but sorting might need casting.
    # For MVP, assuming int fits in DB sort or fetch all and sort in Py.
    users = db.query(User).all()
    # Manual sort for string rep
    users.sort(key=lambda u: int(u.reputation), reverse=True)
    return users[:10]

@app.post("/upload")
async def upload_proof(file: UploadFile = File(...)):
    uploads_dir = "uploads"
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)
    
    file_location = f"{uploads_dir}/{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    return {"info": f"file '{file.filename}' saved at '{file_location}'", "url": f"http://localhost:8000/uploads/{file.filename}"}

from fastapi.staticfiles import StaticFiles
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
