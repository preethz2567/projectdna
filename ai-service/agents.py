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

def revision_agent(repository_id: str, experiences: list, questions: list) -> dict:
    """
    Generates a condensed revision guide combining:
    - Most likely interview questions from past experiences
    - Architecture summary
    - Key technical decisions
    - What went wrong previously and how to answer it
    """
    chunks = retrieve(repository_id, 'architecture authentication database deployment key decisions', top_k=6)
    context = build_context(chunks)

    # Summarize past experiences
    exp_summary = ""
    if experiences:
        exp_summary = "\n\nPAST INTERVIEW/HACKATHON EXPERIENCES:\n"
        for e in experiences[:5]:
            exp_summary += f"- {e.get('experience_type', '')} at {e.get('company_or_event', 'Unknown')}\n"
            if e.get('what_went_wrong'):
                exp_summary += f"  What went wrong: {e.get('what_went_wrong')}\n"
            if e.get('questions_asked'):
                qs = e.get('questions_asked', [])
                if isinstance(qs, list):
                    exp_summary += f"  Questions asked: {', '.join(str(q) for q in qs[:3])}\n"

    # Include top interview questions
    q_summary = ""
    if questions:
        q_summary = "\n\nTOP INTERVIEW QUESTIONS FOR THIS PROJECT:\n"
        for q in questions[:10]:
            q_summary += f"- {q.get('question', '')}\n"

    system_prompt = """You are a technical interview coach preparing a developer for their interview.
Generate a focused revision guide they can read in 10 minutes.
Structure it with these exact sections:
## 2-Minute Pitch
## Key Technical Decisions
## Likely Questions (with brief answers)
## What to Improve Next Time
## Architecture in One Paragraph

Be specific to THIS project. Be concise. Use bullet points where helpful."""

    user_message = f"{context}{exp_summary}{q_summary}\n\nGenerate the revision guide."

    response = call_llm(system_prompt, user_message, max_tokens=2000)
    return { 'guide': response, 'agent': 'revision' }

def recommendations_agent(user_projects: list) -> dict:
    """
    Suggests new project ideas based on the user's existing projects.
    Analyzes patterns in what they've built and suggests the next logical step.
    """
    if not user_projects:
        return {
            'recommendations': [
                {'title': 'Build a REST API', 'description': 'Start with a simple CRUD API using Node/Express and PostgreSQL', 'why': 'Foundation for everything else', 'difficulty': 'beginner'},
                {'title': 'Add Authentication', 'description': 'Add JWT auth to your existing API', 'why': 'Most apps need auth', 'difficulty': 'beginner'},
            ],
            'agent': 'recommendations'
        }

    # Summarize what the user has built
    built_summary = "PROJECTS THIS DEVELOPER HAS BUILT:\n"
    tech_seen = set()
    for p in user_projects[:10]:
        built_summary += f"\n- {p.get('title', 'Unnamed')}: {p.get('description', '')}"
        if p.get('tech_stack'):
            ts = p.get('tech_stack', [])
            if isinstance(ts, list):
                tech_seen.update(ts)

    if tech_seen:
        built_summary += f"\n\nTech they already know: {', '.join(list(tech_seen)[:20])}"

    system_prompt = """You are a senior engineer advising a developer on what to build next.
Based on their project history, suggest 4 project ideas that:
1. Build on what they already know
2. Introduce exactly ONE new concept they haven't used yet
3. Are genuinely interesting, not generic CRUD apps

Format as JSON array:
[
  {
    "title": "Project name",
    "description": "What it does in 2 sentences",
    "why": "Why this specifically for this developer based on their history",
    "new_concept": "The one new thing they'd learn",
    "difficulty": "beginner|intermediate|advanced",
    "tech_stack": ["tech1", "tech2"]
  }
]
Return ONLY the JSON array."""

    raw = call_llm(system_prompt, built_summary, max_tokens=1500)

    import json, re
    try:
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        recs = json.loads(match.group()) if match else []
    except Exception:
        recs = []

    return { 'recommendations': recs, 'agent': 'recommendations' }
