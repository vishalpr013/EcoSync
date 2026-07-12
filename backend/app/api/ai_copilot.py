"""
AI Copilot API routes: Chat Assistant, conversations CRUD, streaming endpoint.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone
import uuid

from app.database.session import get_db
from app.api.deps import get_current_user, require_roles
from app.core.security import UserRole
from app.models.core import User
from app.schemas.common import MessageResponse, IDResponse
from app.core.config import settings

router = APIRouter()

# In-memory database store for conversation threads and messages
conversations_db = {}
messages_db = {}


@router.get("/conversations")
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all AI conversations for the logged in user."""
    user_id_str = str(current_user.id)
    return conversations_db.get(user_id_str, [])


@router.post("/conversations", response_model=IDResponse)
async def create_conversation(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new AI chat conversation thread."""
    conv_id = str(uuid.uuid4())
    user_id_str = str(current_user.id)
    
    new_conv = {
        "id": conv_id,
        "title": data.get("title", "New Conversation"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    if user_id_str not in conversations_db:
        conversations_db[user_id_str] = []
    conversations_db[user_id_str].insert(0, new_conv)
    messages_db[conv_id] = []
    
    return IDResponse(id=conv_id, message="Conversation created")


@router.get("/conversations/{conv_id}")
async def get_conversation(
    conv_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get conversation details along with its messages list."""
    conv_id_str = str(conv_id)
    messages = messages_db.get(conv_id_str, [])
    return {"id": conv_id_str, "messages": messages}


@router.delete("/conversations/{conv_id}", response_model=MessageResponse)
async def delete_conversation(
    conv_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a conversation thread."""
    conv_id_str = str(conv_id)
    user_id_str = str(current_user.id)
    
    if user_id_str in conversations_db:
        conversations_db[user_id_str] = [c for c in conversations_db[user_id_str] if c["id"] != conv_id_str]
    if conv_id_str in messages_db:
        del messages_db[conv_id_str]
        
    return MessageResponse(message="Conversation deleted")


@router.post("/chat")
async def send_chat_message(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send chat message to Gemini Copilot and receive streaming response.
    Expects conversation_id and content in data.
    """
    message = data.get("content", "")
    conversation_id = data.get("conversation_id")
    conv_id_str = str(conversation_id) if conversation_id else None
    
    api_key = settings.GEMINI_API_KEY
    is_mock = not api_key or api_key == "YOUR_GEMINI_API_KEY_HERE"

    # Store user query in local conversation log
    if conv_id_str:
        user_msg = {
            "id": str(uuid.uuid4()),
            "role": "user",
            "content": message,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        if conv_id_str not in messages_db:
            messages_db[conv_id_str] = []
        messages_db[conv_id_str].append(user_msg)

    def response_generator():
        full_reply_chunks = []
        
        if is_mock:
            mock_chunks = [
                "Hello! I am your **EcoSync AI Copilot** (Demo Mode).\n\n",
                "*Note: Please paste your Gemini API key in `backend/.env` to query the live Gemini models.*\n\n",
                f"You asked: *\"{message}\"*\n\n",
                "Here is some general ESG advice for your query:\n",
                "1. **Environmental**: Verify carbon transactional entries against Scope 2 electricity factors.\n",
                "2. **Social**: Require evidence uploads before approving CSR community activities.\n",
                "3. **Governance**: Regularly audit open compliance issues before they become overdue."
            ]
            for chunk in mock_chunks:
                yield chunk
                full_reply_chunks.append(chunk)
        else:
            try:
                from google import genai
                client = genai.Client(api_key=api_key)
                stream = client.models.generate_content_stream(
                    model="gemini-2.5-flash",
                    contents=message,
                    config={
                        "system_instruction": (
                            "You are EcoSync AI, an expert ESG consultant and sustainability assistant integrated into Odoo ERP. "
                            "Help the user analyze environmental scores, carbon transactions, social CSR compliance, and governance policies. "
                            "Be brief, structured, and use Markdown formatting."
                        )
                    }
                )
                for chunk in stream:
                    if chunk.text:
                        yield chunk.text
                        full_reply_chunks.append(chunk.text)
            except Exception as e:
                err_msg = f"EcoSync AI was unable to reach Gemini API: *{str(e)}*\n\nLocal Response to your query: '{message}'"
                yield err_msg
                full_reply_chunks.append(err_msg)

        # Store AI response in local conversation log after generator is completed
        if conv_id_str:
            assistant_msg = {
                "id": str(uuid.uuid4()),
                "role": "assistant",
                "content": "".join(full_reply_chunks),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            messages_db[conv_id_str].append(assistant_msg)

    return StreamingResponse(response_generator(), media_type="text/event-stream")


@router.post("/report")
async def generate_ai_report(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER))
):
    """Generate executive ESG report narrative using Gemini LLM."""
    return {"narrative": "This is a placeholder narrative ESG summary generated by EcoSync AI."}


@router.post("/recommendations")
async def get_sustainability_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.ESG_MANAGER))
):
    """Get automated carbon reduction and compliance recommendations."""
    return {
        "recommendations": [
            {"title": "Optimize Fleet Routes", "category": "Scope 1", "reduction_est": "15%"},
            {"title": "Implement Solar Array for Main Office", "category": "Scope 2", "reduction_est": "30%"}
        ]
    }
