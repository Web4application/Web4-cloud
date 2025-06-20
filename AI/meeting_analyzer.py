from fastapi import FastAPI, Request
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

openai.api_key = os.getenv("OPENAI_API_KEY")

SYSTEM_PROMPT = """
You are an expert assistant trained to extract actionable insights from software project meeting transcripts.

Your responsibilities include:
1. Extracting clear action items with:
   - Task description
   - Assigned owner (or "TBD")
   - Deadline (or "TBD")

2. Identifying references to project files or structure, and suggesting:
   - Directory layout improvements
   - Missing components for functionality
   - Refactors to improve maintainability

Respond with clear bullet-point lists. Mark missing data as "TBD".
"""

class Transcript(BaseModel):
    text: str

@app.post("/analyze-transcript/")
async def analyze_transcript(data: Transcript):
    user_prompt = f"Pull out action items and structural recommendations from this transcript:\n\n{data.text}"

    response = openai.ChatCompletion.create(
        model="gpt-4-1106-preview",  # or gpt-4.5, or whatever you're on
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=800,
        temperature=0.3,
    )

    return {"output": response.choices[0].message["content"]}
