pip install -r requirements.txt
uvicorn main:app --reload
docker build -t web4ai-gemini-backend .
docker run -p 8000:8000 web4ai-gemini-backend
