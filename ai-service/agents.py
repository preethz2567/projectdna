from llm import call_llm
from rag import retrieve


def build_context(chunks: list[dict]) -> str:
    """Formats retrieved chunks into a context block for the prompt."""
    if not chunks:
        return "No repository context available."
    context = "REPOSITORY CONTEXT (use only this information to answer):\n\n"
    for chunk in chunks:
        context += f"[{chunk['chunk_type'].upper()} - {chunk['file_path']}]\n"
        context += chunk['content'] + "\n\n"
    return context


# Agent 1: General Chat
def chat_agent(repository_id: str, question: str, chat_history: list = []) -> dict:
    """
    Answers free-form questions about the project.
    Retrieves relevant chunks first, then answers grounded in that context.
    """
    chunks = retrieve(repository_id, question, top_k=4)
    context = build_context(chunks)

    system_prompt = """You are ProjectDNA, an AI assistant that helps developers understand their software projects.
Answer questions accurately based ONLY on the repository context provided.
If the context doesn't contain enough information to answer, say so clearly.
Be concise and technical. Format code snippets with markdown."""

    user_message = f"{context}\n\nQuestion: {question}"

    response = call_llm(system_prompt, user_message)
    return {
        'response': response,
        'agent': 'chat',
        'sources': [{'file': c['file_path'], 'type': c['chunk_type']} for c in chunks]
    }


# Agent 2: Documentation Agent 
def documentation_agent(repository_id: str, doc_type: str, repo_data: dict) -> dict:
    """
    Generates specific documentation sections.
    doc_type: 'overview' | 'architecture' | 'api_docs' | 'deployment' | 'readme'
    """
    query_map = {
        'overview': 'project purpose goals features summary',
        'architecture': 'system design components services database structure',
        'api_docs': 'API endpoints routes HTTP methods request response',
        'deployment': 'deployment docker AWS cloud infrastructure setup',
        'readme': 'project overview installation setup usage'
    }
    query = query_map.get(doc_type, 'project overview')
    chunks = retrieve(repository_id, query, top_k=6)
    context = build_context(chunks)

    prompts = {
        'overview': "Write a clear project overview: what it does, who it's for, key features. 2-3 paragraphs.",
        'architecture': "Explain the system architecture: components, how they interact, data flow, tech choices and why.",
        'api_docs': "Document the API endpoints visible from the codebase: method, path, purpose, request/response format.",
        'deployment': "Write a deployment guide based on the infrastructure visible in the codebase.",
        'readme': "Generate a complete README.md with: project title, description, tech stack, installation, usage, folder structure."
    }

    system_prompt = f"""You are a technical documentation expert.
Generate accurate, well-structured {doc_type} documentation based ONLY on the repository context.
Use markdown formatting. Be specific and technical."""

    user_message = f"{context}\n\nTask: {prompts.get(doc_type, 'Generate project documentation.')}"

    content = call_llm(system_prompt, user_message, max_tokens=2000)
    return {
        'doc_type': doc_type,
        'content': content,
        'agent': 'documentation'
    }


# Agent 3: Interview Preparation Agent 
def interview_agent(repository_id: str, category: str, repo_data: dict) -> dict:
    """
    Generates interview questions with answers for a specific category.
    category: 'technical' | 'architecture' | 'database' | 'deployment' | 'hr' | 'viva'
    """
    chunks = retrieve(repository_id, f'{category} questions about this project', top_k=5)
    context = build_context(chunks)

    category_prompts = {
        'technical': 'Generate 8 technical questions about the implementation, libraries used, and coding decisions.',
        'architecture': 'Generate 6 questions about system design, component choices, scalability, and architectural decisions.',
        'database': 'Generate 6 questions about database schema, queries, indexing, and data modeling decisions.',
        'deployment': 'Generate 5 questions about Docker, cloud deployment, CI/CD, and infrastructure decisions.',
        'hr': 'Generate 5 HR questions: project challenges, teamwork, what you learned, what you would do differently.',
        'viva': 'Generate 8 viva/defense questions that probe deep understanding of every technical decision made.'
    }

    system_prompt = """You are an expert technical interviewer.
Generate realistic interview questions with detailed model answers based on this specific project.
Format your response as a JSON array:
[
  {
    "question": "...",
    "answer": "...",
    "difficulty": "easy|medium|hard"
  }
]
Return ONLY the JSON array, no other text."""

    user_message = f"{context}\n\nTask: {category_prompts.get(category, 'Generate interview questions.')}"

    raw = call_llm(system_prompt, user_message, max_tokens=2500)

    import json, re
    try:
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        questions = json.loads(match.group()) if match else []
    except Exception:
        questions = []

    return {
        'category': category,
        'questions': questions,
        'agent': 'interview'
    }


# Agent 4: Improvement Agent 
def improvement_agent(repository_id: str, repo_data: dict) -> dict:
    """
    Analyzes the project and suggests improvements across multiple dimensions.
    """
    chunks = retrieve(repository_id, 'security authentication validation error handling performance', top_k=6)
    context = build_context(chunks)

    system_prompt = """You are a senior software engineer conducting a code review.
Analyze this project and provide actionable improvement suggestions.
Format your response as JSON:
{
  "security": ["suggestion1", "suggestion2"],
  "performance": ["suggestion1", "suggestion2"],
  "code_quality": ["suggestion1", "suggestion2"],
  "missing_features": ["suggestion1", "suggestion2"],
  "deployment": ["suggestion1", "suggestion2"]
}
Return ONLY the JSON, no other text. Be specific and reference actual things you see in the codebase."""

    user_message = f"{context}\n\nAnalyze this project and suggest improvements."

    raw = call_llm(system_prompt, user_message, max_tokens=2000)

    import json, re
    try:
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        suggestions = json.loads(match.group()) if match else {}
    except Exception:
        suggestions = {'raw': raw}

    return {
        'suggestions': suggestions,
        'agent': 'improvement'
    }


#  Agent 5: Architecture Agent 
def architecture_agent(repository_id: str, repo_data: dict) -> dict:
    """
    Generates a deep architectural explanation of the project.
    """
    chunks = retrieve(repository_id, 'architecture components services database API design patterns', top_k=6)
    context = build_context(chunks)

    system_prompt = """You are a software architect explaining a system to a developer.
Provide a comprehensive architectural breakdown covering:
1. High-level overview (2-3 sentences)
2. Core components and their responsibilities
3. Data flow (how a typical request moves through the system)
4. Database design rationale
5. Key architectural decisions and trade-offs
6. How this would scale

Use markdown with clear headings. Be specific about what you see in THIS project."""

    user_message = f"{context}\n\nExplain the architecture of this project in depth."

    response = call_llm(system_prompt, user_message, max_tokens=2000)
    return {
        'explanation': response,
        'agent': 'architecture'
    }
