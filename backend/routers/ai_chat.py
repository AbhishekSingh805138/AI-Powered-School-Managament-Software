from fastapi import APIRouter, HTTPException, Depends
from models.chat import ChatMessage, ChatResponse
from core.dependencies import get_current_user
from config.settings import EMERGENT_LLM_KEY
from emergentintegrations.llm.chat import LlmChat, UserMessage

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/chat", response_model=ChatResponse)
async def ai_chat(chat_message: ChatMessage, current_user: dict = Depends(get_current_user)):
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=chat_message.session_id,
            system_message="You are an AI assistant for a school management system. Help users with questions about student management, attendance, grades, timetables, and general educational queries. Be helpful, professional, and concise."
        ).with_model("openai", "gpt-4o")
        
        user_message = UserMessage(text=chat_message.message)
        response = await chat.send_message(user_message)
        
        return ChatResponse(
            response=response,
            session_id=chat_message.session_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat error: {str(e)}")
