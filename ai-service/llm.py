import os
import requests

OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
MODEL = os.getenv('LLM_MODEL', 'google/gemma-3-12b-it')
OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'


def call_llm(system_prompt: str, user_message: str, max_tokens: int = 1500) -> str:
    """
    Calls OpenRouter API with a system + user message.
    Returns the assistant's response text.
    """
    if not OPENROUTER_API_KEY:
        return "LLM not configured. Add OPENROUTER_API_KEY to .env"

    response = requests.post(
        OPENROUTER_URL,
        headers={
            'Authorization': f'Bearer {OPENROUTER_API_KEY}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3001',
        },
        json={
            'model': MODEL,
            'messages': [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_message}
            ],
            'max_tokens': max_tokens,
            'temperature': 0.2
        },
        timeout=300
    )
    response.raise_for_status()
    return response.json()['choices'][0]['message']['content']
