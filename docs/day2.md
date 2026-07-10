# ProjectDNA — Day 2: AI Pipeline & RAG System

**Date:** July 10, 2026
**Goal:** Build the complete AI backend — RAG pipeline, LLM integration, and 5 specialized agents.

--

## What I Built

### 1. RAG Pipeline (`rag.py`)

The core retrieval-augmented generation system that lets the AI answer questions grounded in actual repository content.

**Pipeline flow:**
```
Repository data → Chunk → Embed → FAISS Index → Retrieve → LLM → Answer
```

**Three main functions:**

| Function | Purpose |
|----------|---------|
| `chunk_repository()` | Splits repo data into logical text chunks (README sections, folder structure, tech stack, dependencies, project metadata) |
| `index_repository()` | Generates embeddings with `all-MiniLM-L6-v2`, builds FAISS index, saves to disk + PostgreSQL |
| `retrieve()` | Embeds query, finds top-k nearest neighbors via FAISS, fetches chunk content from DB |

**Chunking strategy — semantic, not token-based:**
- README is split by `## ` headings → each section becomes its own chunk
- Folder structure, tech stack, dependencies, and project vision each get dedicated chunks
- Each chunk is capped at 2000 characters
- This produces ~5-15 chunks per repository, giving the retriever meaningful semantic units

**Why FAISS over a vector database (Pinecone, Weaviate)?**
- Zero infrastructure — FAISS is a library, not a service
- Sufficient for per-project indexes (small corpus, <100 chunks)
- Saved as flat files (`./data/faiss_{repo_id}.index`) — no external dependencies

**Why `all-MiniLM-L6-v2`?**
- 80MB model (downloads once, cached locally)
- 384-dimensional embeddings — small but effective
- Optimized for semantic similarity search
- Fast inference on CPU (no GPU required)

--

### 2. LLM Integration (`llm.py`)

A thin wrapper around the OpenRouter API — 35 lines of code.

**Configuration:**
- API: OpenRouter (`https://openrouter.ai/api/v1/chat/completions`)
- Model: `google/gemma-3-12b-it` (configurable via `.env`)
- Format: System + User message pair
- Timeout: 60 seconds
- Max tokens: configurable per call (default 1500)

**Why OpenRouter over direct OpenAI/Anthropic?**
- Single API, multiple model providers — can switch models by changing one env variable
- No vendor lock-in
- Pay-per-token pricing, no monthly commitment

---

### 3. Five Specialized Agents (`agents.py`)

Each agent follows the same pattern: **retrieve context → craft prompt → call LLM → parse response**.

| Agent | Endpoint | Input | Output |
|-------|----------|-------|--------|
| **Chat** | `POST /chat` | Free-form question | Natural language answer with source citations |
| **Documentation** | `POST /generate/documentation` | `doc_type` (overview/architecture/api_docs/deployment/readme) | Structured markdown documentation |
| **Interview** | `POST /generate/interview-questions` | `category` (technical/architecture/database/deployment/hr/viva) | JSON array of Q&A with difficulty |
| **Improvement** | `POST /generate/improvements` | — | JSON with suggestions by category (security/performance/code_quality/deployment/missing_features) |
| **Architecture** | `POST /generate/architecture` | — | Deep architectural breakdown in markdown |

**Prompt engineering decisions:**
- Each agent has a specialized system prompt defining its role and output format
- Interview and Improvement agents request JSON output for structured data
- JSON extraction uses regex fallback (`re.search(r'\[.*\]', raw, re.DOTALL)`) since LLMs sometimes wrap JSON in explanation text
- Context window is managed by limiting `top_k` chunks (4 for chat, 5-6 for deeper analysis)

---

### 4. Flask API Wiring (`app.py`)

Replaced the Day 1 placeholder stubs with fully functional endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Service health check |
| POST | `/index` | Trigger RAG indexing for a repository |
| POST | `/chat` | Chat agent |
| POST | `/generate/documentation` | Documentation agent |
| POST | `/generate/interview-questions` | Interview agent |
| POST | `/generate/improvements` | Improvement agent |
| POST | `/generate/architecture` | Architecture agent |

**Design decision — lazy imports:** Agent modules are imported inside route handlers, not at the top of `app.py`. This means the Flask server starts instantly, and the sentence-transformer model only loads when the first AI request hits.

---

### 5. Node.js Orchestration Layer (`server/src/routes/ai.js`)

The Express backend orchestrates calls to the Flask service, handles authentication, and persists results to PostgreSQL.

**AI Generation endpoints (proxy to Flask):**

| Method | Path | Behavior |
|--------|------|----------|
| POST | `/ai/index` | Fetches repo data from DB → sends to Flask → logs timeline event |
| POST | `/ai/chat` | Sends message + chat history → saves both user message and AI response to `chat_messages` |
| POST | `/ai/generate/documentation` | Generates doc → upserts to `documents` table (by project + doc_type) |
| POST | `/ai/generate/interview-questions` | Generates Q&A → inserts each question into `interview_questions` table |
| POST | `/ai/generate/improvements` | Returns suggestions (not persisted — generated fresh each time) |
| POST | `/ai/generate/architecture` | Returns architecture analysis |

**Data retrieval endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/ai/chat/history` | Fetch all chat messages for a project |
| GET | `/ai/documents` | Fetch all generated documents |
| GET | `/ai/interview-questions` | Fetch questions (optional `?category=` filter) |
| GET | `/ai/timeline` | Fetch project timeline events |
| GET | `/ai/feedback` | Fetch mentor feedback |
| POST | `/ai/feedback` | Add mentor feedback |
| POST | `/ai/experiences` | Log interview/hackathon experience |
| GET | `/ai/experiences` | Fetch experience logs |

--

### 6. Schema Updates

**`documents` table** — added `UNIQUE(project_id, doc_type)` constraint to support `ON CONFLICT ... DO UPDATE` upsert. Re-generating documentation for the same type updates the existing record instead of creating duplicates.

**`repositories` table** — added `UNIQUE(project_id)` constraint for repository upsert. Re-connecting a GitHub repo to the same project updates instead of duplicating.

**Migration safety** — constraints are added via `DO $$ BEGIN ... IF NOT EXISTS ... END $$` blocks, making the migration idempotent for existing databases.

--

## Port Map (Updated)

| Service | Port |
|---------|------|
| Express API | 3001 |
| Vite Dev Server | 5173 |
| Flask AI Service | **5002** (changed from 5001 — Docker Desktop occupies 5001) |
| PostgreSQL | 5433 |
| Redis | 6379 |

--

## Test Results

### Indexing
```
POST /ai/index → {"status":"indexed","chunks":12,"repository_id":"3f7a4866-..."}
```
12 chunks extracted from memory-gallery repository.

### Chat Agent
```
POST /ai/chat → "This project is a personal photo gallery with reactions.
It demonstrates a full DevOps lifecycle..."
```
Accurate, grounded in actual README content.

### Tech Stack Detection (via Chat)
```
POST /ai/chat → Frontend: React + TypeScript + Vite, TanStack Query
Backend: Node.js + Express, Multer, AWS SDK v3
Database: PostgreSQL, Storage: AWS S3, Infra: Terraform, CI/CD: GitHub Actions
```
Correctly identified all stack components from the repository.

### Improvement Agent
Generated 25 actionable suggestions across 5 categories (security, performance, code quality, deployment, missing features). Each suggestion references specific elements from the actual codebase.

--

## Terminal Screenshots

### AI Indexing
<!-- Paste screenshot: curl POST /ai/index showing {"status":"indexed","chunks":12} -->
> 📸 `[Paste terminal screenshot here]`

### Chat Response
<!-- Paste screenshot: curl POST /ai/chat showing AI response about the project -->
> 📸 `[Paste terminal screenshot here]`

### Improvement Suggestions
<!-- Paste screenshot: curl POST /generate/improvements showing structured suggestions -->
> 📸 `[Paste terminal screenshot here]`

--

## Files Created / Modified Today

```
ai-service/
├── rag.py          [NEW]  ← RAG pipeline (chunk, embed, index, retrieve)
├── llm.py          [NEW]  ← OpenRouter API wrapper
├── agents.py       [NEW]  ← 5 specialized AI agents
├── app.py          [MOD]  ← Replaced stubs with real endpoints
└── .env            [MOD]  ← Added DATABASE_URL, model config, port 5002

server/
├── src/
│   ├── routes/
│   │   └── ai.js   [NEW]  ← AI orchestration routes (16 endpoints)
│   ├── app.js      [MOD]  ← Registered AI routes
│   └── db/
│       └── schema.sql [MOD] ← Added UNIQUE constraints for upserts
└── .env            [MOD]  ← Updated AI_SERVICE_URL to port 5002
```

--

## Issues Encountered & Resolved

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Port 5001 conflict | Docker Desktop uses 5001 internally | Changed Flask to port 5002 |
| `ON CONFLICT` error | Missing UNIQUE constraint on `repositories.project_id` | Added constraint + idempotent migration |
| Model 404 from OpenRouter | `meta-llama/llama-3.1-8b-instruct:free` no longer available | Switched to `google/gemma-3-12b-it` |
| First indexing timeout | Sentence-transformer model downloading (~80MB) | Pre-downloaded model, subsequent calls are fast |
| Database port mismatch | `ai-service/.env` had port 5432, Docker maps to 5433 | Fixed DATABASE_URL to use 5433 |

--

## What's Next — Day 3

- [ ] Set up React client routing and page structure
- [ ] Build authentication pages (login, register)
- [ ] Create the project dashboard UI
- [ ] Wire frontend to backend API with axios and react-query
- [ ] Implement the AI chat interface component
