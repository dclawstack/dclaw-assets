"""AI Copilot service: Ollama local (primary) → OpenRouter cloud (fallback)."""

from __future__ import annotations

import httpx

from app.core.config import settings


SYSTEM_PROMPT_TEMPLATE = """You are the DClaw Assets AI Copilot — an expert IT asset management assistant.
You have access to live inventory data for this organization:

{context}

Answer questions about IT assets, assignments, warranties, maintenance, and procurement.
Keep responses concise (3-5 sentences max unless detail is requested).
Format numbers clearly. When referring to specific assets use their asset tag or name.
If asked something outside of IT asset management, politely redirect to asset-related topics.
Today's date: {today}."""


async def _call_ollama(messages: list[dict]) -> str:
    """Call local Ollama API."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{settings.ollama_base_url}/api/chat",
            json={
                "model": settings.ollama_model,
                "messages": messages,
                "stream": False,
            },
        )
        response.raise_for_status()
        return response.json()["message"]["content"]


async def _call_openrouter(messages: list[dict]) -> str:
    """Call OpenRouter cloud API."""
    if not settings.openrouter_api_key:
        raise ValueError("OpenRouter API key not configured")
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "HTTP-Referer": "https://dclaw.io",
                "X-Title": "DClaw Assets Copilot",
            },
            json={
                "model": settings.openrouter_model,
                "messages": messages,
            },
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]


async def chat(user_message: str, context: str, today: str) -> str:
    """Send a chat message with injected inventory context.

    Tries Ollama first; falls back to OpenRouter on any error.
    """
    system_content = SYSTEM_PROMPT_TEMPLATE.format(context=context, today=today)
    messages = [
        {"role": "system", "content": system_content},
        {"role": "user", "content": user_message},
    ]

    try:
        return await _call_ollama(messages)
    except Exception:
        pass  # Ollama unavailable — try cloud fallback

    try:
        return await _call_openrouter(messages)
    except Exception as exc:
        raise RuntimeError(
            "AI Copilot is unavailable. Please configure Ollama locally or set OPENROUTER_API_KEY."
        ) from exc
