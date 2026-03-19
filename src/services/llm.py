"""Gemini LLM via LangChain."""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

DEFAULT_SYSTEM_PROMPT = """You are a friendly, helpful assistant. You can speak in Hindi, English, or Hinglish (code-mixed) naturally.
Keep responses concise and conversational—suitable for voice playback.
Respond in the same language style the user uses when possible."""


def create_llm(api_key: str, model: str = "gemini-3.1-flash-lite-preview") -> ChatGoogleGenerativeAI:
    """Create a Gemini chat model."""
    return ChatGoogleGenerativeAI(
        model=model,
        google_api_key=api_key,
        temperature=0.7,
    )


def get_reply(
    user_message: str,
    *,
    api_key: str,
    history: list[dict] | None = None,
    system_prompt: str | None = None,
    model: str = "gemini-3.1-flash-lite-preview",
) -> str:
    """
    Get LLM reply given user message and optional conversation history.
    history: list of {"role": "user"|"assistant", "content": "..."}
    """
    llm = create_llm(api_key=api_key, model=model)
    system = system_prompt or DEFAULT_SYSTEM_PROMPT

    messages = [SystemMessage(content=system)]

    if history:
        for msg in history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                messages.append(AIMessage(content=msg["content"]))

    messages.append(HumanMessage(content=user_message))

    response = llm.invoke(messages)
    content = response.content if hasattr(response, "content") else response
    return _extract_text(content)


def _extract_text(content) -> str:
    """Normalize Gemini 3.x (list of dicts) and 2.5 (plain string) responses to plain text."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict) and "text" in item:
                parts.append(item["text"])
            elif isinstance(item, str):
                parts.append(item)
        return " ".join(parts) if parts else ""
    return str(content)
