from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Web4AI API is live!"}
