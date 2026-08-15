import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from nemoguardrails import LLMRails, RailsConfig
import uvicorn
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

config = RailsConfig.from_path("config")
rails_app = LLMRails(config)

@app.post("/api/chat")
async def chat_endpoint(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    from collections import namedtuple
    Req = namedtuple('Req', ['userRole', 'activeRoute', 'pageTitle', 'visiblePageData', 'userPrompt'])
    
    req_obj = Req(
        userRole=body.get("userRole", "UNKNOWN"),
        activeRoute=body.get("activeRoute", ""),
        pageTitle=body.get("pageTitle", ""),
        visiblePageData=body.get("visiblePageData", {}),
        userPrompt=body.get("userPrompt", "")
    )

    context = f"""
    Current User Role: {req_obj.userRole}
    Active Route: {req_obj.activeRoute}
    Page Title: {req_obj.pageTitle}
    Visible Page Data: {req_obj.visiblePageData}
    """

    messages = [
        {"role": "context", "content": context},
        {"role": "user", "content": req_obj.userPrompt}
    ]

    async def generate_stream():
        from nemoguardrails.streaming import StreamingHandler
        import asyncio
        import os
        
        # Support reading GROQ_API_KEY or VITE_GROQ_API_KEY
        groq_key = os.environ.get("GROQ_API_KEY") or os.environ.get("VITE_GROQ_API_KEY")
        if groq_key:
            os.environ["OPENAI_API_KEY"] = groq_key
            
        # Fallback if no valid key is provided
        current_key = os.environ.get("OPENAI_API_KEY", "")
        if not current_key or current_key.startswith("nvapi"):
            yield "Hi! I am currently running in MOCK mode because a valid Groq API key was not found. Please provide your Groq API key in the `.env` file to enable real AI responses!"
            return

        streaming_handler = StreamingHandler()
        
        task = asyncio.create_task(
            rails_app.generate_async(messages=messages, streaming_handler=streaming_handler)
        )
        
        try:
            logger.info("Starting stream...")
            async for chunk in streaming_handler:
                logger.info(f"Chunk: {chunk}")
                yield chunk
            logger.info("Stream finished.")
        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield f"\n\n[Error: {str(e)}]"
        
        try:
            await task
        except Exception as e:
            logger.error(f"Task error: {e}")
            if "openai_api_key" in str(e).lower() or "validation error" in str(e).lower() or "401" in str(e):
                yield "\n\n[System Error: Invalid API Key. Please check your Groq API Key in the .env file!]"
            else:
                yield f"\n\n[System Error: {str(e)}]"

    from fastapi.responses import StreamingResponse
    return StreamingResponse(generate_stream(), media_type="text/plain")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
