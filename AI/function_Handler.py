from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import google.generativeai as genai

# Configure Gemini
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

model = genai.GenerativeModel(
    model_name="gemini-1.0-pro-vision-latest",
    generation_config={
        "temperature": 0.65,
        "top_p": 0.7,
        "top_k": 32,
        "max_output_tokens": 1024,
        "response_mime_type": "text/plain",
    },
)

app = FastAPI()

class TaskRequest(BaseModel):
    action: str
    input_text: str

def gemini_query(prompt: str) -> str:
    response = model.generate_content([f"input: {prompt}", "output: "])
    return response.text.strip()

def generate_poem(topic: str) -> str:
    prompt = f"Write a beautiful poem about {topic}."
    return gemini_query(prompt)

def generate_story(topic: str) -> str:
    prompt = f"Write a captivating short story set in {topic}."
    return gemini_query(prompt)

def generate_bot_code(description: str) -> str:
    return f"// Bot code for: {description}\n// [Code generation not yet implemented]"

def schedule_helper(task: str) -> str:
    return f"Task scheduled: {task}"

def default_chat(input_text: str) -> str:
    prompt = f"Chat response: {input_text}"
    return gemini_query(prompt)

@app.post("/api/task")
async def handle_task(req: TaskRequest):
    action = req.action.lower()
    input_text = req.input_text

    if action == "gemini_query":
        result = gemini_query(input_text)
    elif action == "generate_poem":
        result = generate_poem(input_text)
    elif action == "generate_story":
        result = generate_story(input_text)
    elif action == "generate_bot_code":
        result = generate_bot_code(input_text)
    elif action == "schedule_helper":
        result = schedule_helper(input_text)
    elif action == "default_chat":
        result = default_chat(input_text)
    else:
        raise HTTPException(status_code=400, detail="Action not recognized.")

    return {"result": result}
