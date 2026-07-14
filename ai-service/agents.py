from llm import call_llm
from rag import retrieve

# ── Anti-hallucination enforcement block (appended to every agent prompt) ──
ANTI_HALLUCINATION_RULES = """

CRITICAL RULES:
- If the context says "No repository content has been indexed yet" — tell the user exactly that and ask them to click "Index for AI" on the Repository page first.
- If you cannot find specific information in the provided context — say "I don't see that in the indexed files" rather than making something up.
- NEVER invent project names, features, or technical decisions that aren't in the context.
- NEVER describe a "hypothetical" project. Only describe what you actually see in the context.
- If asked about something not in the context, respond: "The indexed files don't contain information about [topic]. This might be in files that weren't indexed, or the repository may need to be re-indexed."
"""


def build_context(chunks: list[dict]) -> str:
    """Formats retrieved chunks into a context block for the prompt."""
    if not chunks:
        return "CONTEXT: No repository content has been indexed yet. The repository has been connected but not indexed, or the index is empty."

    # Check if we only have structural chunks (no actual code or readme content)
    has_real_content = any(
        c.get('chunk_type') in ('readme', 'code', 'docs')
        for c in chunks
    )

    if not has_real_content:
        return "CONTEXT: Only structural metadata is available (file names and folder structure). No source code or documentation has been indexed yet."

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
Be concise and technical. Format code snippets with markdown.""" + ANTI_HALLUCINATION_RULES

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
Use markdown formatting. Be specific and technical.""" + ANTI_HALLUCINATION_RULES

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

    # Guard: refuse to generate questions if there's no real content
    if not chunks or not any(c.get('chunk_type') in ('readme', 'code') for c in chunks):
        return {
            'category': category,
            'questions': [],
            'error': 'No source code has been indexed. Please index the repository first.',
            'agent': 'interview'
        }

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
Return ONLY the JSON array, no other text.""" + ANTI_HALLUCINATION_RULES

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
Return ONLY the JSON, no other text. Be specific and reference actual things you see in the codebase.""" + ANTI_HALLUCINATION_RULES

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

Use markdown with clear headings. Be specific about what you see in THIS project.""" + ANTI_HALLUCINATION_RULES

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

Be specific to THIS project. Be concise. Use bullet points where helpful.""" + ANTI_HALLUCINATION_RULES

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

# ── Agent 6: Architecture Diagram (Mermaid) ─────────────────────────────
def diagram_agent(repository_id: str, diagram_type: str) -> dict:
    """
    Generates Mermaid diagram syntax for the project.
    diagram_type: 'architecture' | 'database' | 'flow' | 'sequence'
    """
    queries = {
        'architecture': 'system components services API layers frontend backend database',
        'database': 'database schema tables relationships foreign keys columns',
        'flow': 'user request flow authentication middleware routes database response',
        'sequence': 'API request response sequence user authentication flow'
    }
    chunks = retrieve(repository_id, queries.get(diagram_type, 'system architecture'), top_k=6)
    context = build_context(chunks)

    type_instructions = {
        'architecture': '''Generate a Mermaid flowchart showing the system architecture.
Use: graph TD
Show all major components and how they connect.
Example structure: Client → API Layer → Services → Database/Storage
Label each arrow with the type of interaction (HTTP, SQL, S3 API, etc.)''',

        'database': '''Generate a Mermaid ER diagram showing the database schema.
Use: erDiagram
Show tables as entities with their key fields.
Show relationships between tables (one-to-many, many-to-many).
Only include tables you can infer from the codebase.''',

        'flow': '''Generate a Mermaid flowchart showing the main user request flow.
Use: graph LR
Show the path from user action through the system to the response.
Include decision points (auth check, validation, etc.)''',

        'sequence': '''Generate a Mermaid sequence diagram for the main API flow.
Use: sequenceDiagram
Show participants: Browser, Express API, Database, S3 (if applicable)
Show the request/response sequence for a typical operation.'''
    }

    system_prompt = f"""You are a software architect creating technical diagrams.
Generate ONLY valid Mermaid diagram syntax based on the repository context.
{type_instructions.get(diagram_type, type_instructions['architecture'])}

CRITICAL RULES:
- Output ONLY the Mermaid code, nothing else
- No markdown code fences (no ```mermaid)
- No explanation text before or after
- Start directly with the diagram type keyword (graph, erDiagram, sequenceDiagram)
- Use only what you can see in the repository context
- Keep it readable — max 15-20 nodes
- ALWAYS enclose node labels containing parentheses, commas, or special characters in quotes (e.g. A["User Action (Upload)"])""" + ANTI_HALLUCINATION_RULES

    user_message = f"{context}\n\nGenerate the {diagram_type} diagram."
    mermaid_code = call_llm(system_prompt, user_message, max_tokens=1000)

    # Clean up common LLM mistakes
    import re
    mermaid_code = re.sub(r'```mermaid\s*', '', mermaid_code)
    mermaid_code = re.sub(r'```\s*', '', mermaid_code)
    mermaid_code = mermaid_code.strip()

    return { 'diagram': mermaid_code, 'type': diagram_type, 'agent': 'diagram' }


# ── Agent 7: Quiz Generator ──────────────────────────────────────────────
def quiz_agent(repository_id: str, difficulty: str = 'medium') -> dict:
    """
    Generates an interactive multiple-choice quiz about the project.
    Returns 8 questions with 4 options each and the correct answer.
    """
    chunks = retrieve(repository_id, 'architecture authentication database deployment API design decisions', top_k=6)
    context = build_context(chunks)

    system_prompt = f"""You are creating a technical quiz about a software project.
Generate exactly 8 multiple-choice questions at {difficulty} difficulty.
Questions should test genuine understanding of THIS project's technical decisions.

Format as JSON array — return ONLY the JSON, nothing else:
[
  {{
    "question": "Why does this project use JWT instead of session-based auth?",
    "options": ["A) It is faster", "B) It allows stateless authentication across services", "C) It is more secure than sessions", "D) Sessions are not supported by Express"],
    "correct": "B",
    "explanation": "JWT enables stateless auth — the server doesn't need to store session state, making it suitable for APIs called from multiple clients."
  }}
]

Make questions specific to THIS project. Test architectural decisions, not generic trivia.""" + ANTI_HALLUCINATION_RULES

    user_message = f"{context}\n\nGenerate {difficulty} difficulty quiz questions about this project."
    raw = call_llm(system_prompt, user_message, max_tokens=2500)

    import json, re
    try:
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        questions = json.loads(match.group()) if match else []
    except Exception:
        questions = []

    return { 'questions': questions, 'difficulty': difficulty, 'agent': 'quiz' }


# ── Agent 8: Deck Generator ──────────────────────────────────────────────
def deck_agent(repository_id: str, deck_type: str = 'technical') -> dict:
    """
    Generates presentation slide content for reveal.js.
    deck_type: 'technical' | 'demo' | 'interview'
    """
    chunks = retrieve(repository_id, 'project overview architecture features deployment tech stack', top_k=8)
    context = build_context(chunks)

    deck_configs = {
        'technical': 'a deep technical presentation for engineers — cover architecture, tech decisions, database design, deployment pipeline, and challenges solved',
        'demo': 'a product demo presentation — cover what it does, key features, live demo flow, tech stack, and what makes it unique',
        'interview': 'an interview/viva presentation — cover project purpose, your role, technical decisions and why, challenges faced, and what you learned'
    }

    system_prompt = f"""You are creating a reveal.js presentation.
Generate {deck_configs.get(deck_type, deck_configs['technical'])}.

Output ONLY a JSON array of slide objects — no other text:
[
  {{
    "title": "Slide Title",
    "content": "Main bullet point\\n• Sub point 1\\n• Sub point 2",
    "notes": "Speaker notes for this slide",
    "type": "title|content|code|diagram"
  }}
]

Rules:
- 8-10 slides total
- First slide: project title and one-line description
- Last slide: key takeaways / what I learned
- content uses \\n for line breaks, • for bullets
- Keep each slide focused — max 4-5 bullet points
- notes field contains what the presenter should SAY, not show
- Be specific to THIS project""" + ANTI_HALLUCINATION_RULES

    user_message = f"{context}\n\nGenerate a {deck_type} presentation deck."
    raw = call_llm(system_prompt, user_message, max_tokens=3000)

    import json, re
    try:
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        slides = json.loads(match.group()) if match else []
    except Exception:
        slides = []

    return { 'slides': slides, 'deck_type': deck_type, 'agent': 'deck' }
