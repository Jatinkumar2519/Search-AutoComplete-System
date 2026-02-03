from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from Trie.Trie import trie

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/insert/{word}")
def insert_word(word: str):
    success = trie.handle(word)
    if not success:
        raise HTTPException(status_code=400, detail="word already exists or invalid")
    return {"status": "inserted", "word": word}

@app.get("/autocomplete/{prefix}")
def autocomplete(prefix: str):
    return {"suggestions": trie.autocomplete(prefix)}

