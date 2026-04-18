from fastapi import FastAPI, Body, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from starlette.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict to your frontend URL later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI()

# Request model
class AskRequest(BaseModel):
    prompt: str

# Response model
class AskResponse(BaseModel):
    response: str

@app.post("/ask-ai/", response_model=AskResponse)
def ask_ai(request: AskRequest = Body(...)):
    try:
        # Step 1: Fetch data from your FastAPI DB API
        try:
            db_response = requests.get("http://127.0.0.1:8000/ocean-data/")  # <-- Your DB API endpoint
            if db_response.status_code == 200:
                db_data = db_response.json()
                db_summary = f"Database returned {len(db_data)} records. Example: {db_data[0] if db_data else 'No data'}"
            else:
                db_summary = "Database fetch failed or returned no data."
        except Exception as e:
            db_summary = f"Error fetching from DB API: {str(e)}"

        # Step 2: Send both user prompt and DB data to OpenAI
        ai_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an assistant that answers questions using both user input and ocean database data."},
                {"role": "system", "content": f"Database information: {db_summary}"},
                {"role": "user", "content": request.prompt},
            ]
        )

        reply = ai_response.choices[0].message.content
        return {"response": reply}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")
