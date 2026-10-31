import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq


# Load environment variables from .env
load_dotenv()

# Get the Groq API key
api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise RuntimeError("GROQ_API_KEY is missing from the .env file")

# Create the Groq client
client = Groq(api_key=api_key)

# Create the FastAPI application
app = FastAPI(
    title="Prompt Engineering Playground API",
    description="Backend for generating and comparing AI responses",
    version="1.0.0"
)


# Allow our frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Define the data we expect from the frontend
class CompareRequest(BaseModel):
    original_prompt: str
    improved_prompt: str


# Function to generate an AI response
# Function to generate an AI response
def generate_response(prompt: str) -> str:
    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "system",
                "content": (
    "You are a helpful educational assistant. "
    "Explain concepts clearly and accurately. "
    "IMPORTANT: Never create Markdown tables. "
    "Never use the pipe character | to format information. "
    "Present comparisons and lists using bullet points instead. "
    "Use clear headings, numbered lists, and bullet points. "
    "Use fenced code blocks for code examples. "
    "Keep explanations organized, complete, and easy to understand. "
    "Adapt the explanation to the audience and style "
    "requested in the user's prompt."
    "Do not add generic closing statements or invitations "
"such as 'Feel free to ask if you want more examples'. "
"End the response after completing the requested explanation. "
)
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2,

        max_tokens=2000
    )


    choices = getattr(response, "choices", None)

    if not choices:
        return ""

    choice = choices[0]
    message = getattr(choice, "message", None)
    content = getattr(message, "content", None)

    if not isinstance(content, str) or not content.strip():
        return ""

    return content.strip()



# Basic health-check endpoint
@app.get("/")
def home():
    return {
        "message": "Prompt Engineering Playground API is running!"
    }


# Compare responses from original and improved prompts
@app.post("/api/compare")

def compare_prompts(request: CompareRequest):

    if not request.original_prompt.strip():
        raise HTTPException(
            status_code=400,
            detail="Original prompt cannot be empty"
        )

    if not request.improved_prompt.strip():
        raise HTTPException(
            status_code=400,
            detail="Improved prompt cannot be empty"
        )

    try:
        original_response = generate_response(
            request.original_prompt
        )

        improved_response = generate_response(
            request.improved_prompt
        )

        if not original_response or not improved_response:
            raise HTTPException(
                status_code=502,
                detail="AI response is unavailable. Please try again."
            )

        return {
            "original_response": original_response,
            "improved_response": improved_response
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"AI request failed: {str(error)}"
        )
