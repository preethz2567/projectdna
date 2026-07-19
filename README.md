<div align="center">
  
# ProjectDNA
*/prəˈdʒɛkt.diː.ɛn.eɪ/ • noun • system*

**The Developer's Copilot for Presentations, Code Reviews, and Vivas**

</div>

When you build something great, writing the code is only half the battle. The other half is explaining it. ProjectDNA is built specifically for the moment *after* the code is shipped—when you need to present your architecture to stakeholders, defend your design choices in a technical viva, or seamlessly onboard a new team member. 

Instead of spending hours manually drawing diagrams or formatting API documentation, ProjectDNA ingests your GitHub repository, semantically maps the architecture using advanced Vector Embeddings, and instantly generates everything you need to communicate your technical vision with absolute clarity.

## Core Philosophy

Built on the belief that documentation should live and breathe alongside the codebase. 

Instead of relying on rigid Abstract Syntax Tree (AST) parsers that constantly break on edge cases, or generic AI prompts that hallucinate context, ProjectDNA uses a highly optimized **Retrieval-Augmented Generation (RAG)** pipeline. Every file in your repository is intelligently chunked, embedded, and stored in a FAISS vector database. When you request a sequence diagram or ask the chat agent a deeply technical question, the orchestrator executes a nearest-neighbor search across the vector space to pull the exact lines of code that govern that logic. The result? 100% grounded, hallucination-free architectural insights.

## Technical Capabilities
* **Semantic Architecture Ingestion** — Codebases aren't just read; they are embedded. We use advanced LLM embeddings to map semantic relationships between files, bypassing token limits entirely.
* **Asynchronous SSE Orchestration** — A Node.js API orchestrates heavy workloads by queuing them in Amazon RDS and streaming real-time status updates via Server-Sent Events (SSE). You never stare at a frozen loading spinner while gigabytes of code are processed.
* **Dynamic Architecture Diagrams** — The AI natively outputs Mermaid.js DSL based on retrieved code relationships, instantly rendering Flowcharts, Sequence Diagrams, Architecture Maps, and ER Diagrams directly in the browser.
* **Interactive Mock Interviews** — Simulates intense technical grill sessions. The AI interrogates you specifically on edge cases, race conditions, and architecture choices found in *your* exact codebase.
* **Presentation Deck Generation** — One-click automated slide deck creation summarizing the project's vision, architecture, and tech stack in a polished, printable format.

## Tech stack
| Layer | Technologies |
| :--- | :--- |
| **Frontend & UI** | React 18, Vite, TypeScript, Zustand, Mermaid.js |
| **Backend & Orchestration** | Node.js, Express, Server-Sent Events (SSE) |
| **AI & Vector Search** | Python, Flask, LangChain, FAISS, OpenAI / Gemini |
| **Database & Persistence** | PostgreSQL (Amazon RDS) |
| **Infrastructure & Deployment**| Terraform, AWS ECS (Fargate), Amazon ECR, Amazon S3 |

## Architecture & Cloud Design
The application is fully containerized and deployed on **Amazon Web Services (AWS)** using Infrastructure-as-Code via **Terraform**. The cloud architecture is heavily optimized for zero-latency inter-service communication and secure secret management.

* **Co-located ECS (Fargate) Tasks**: Both the Node.js backend and the Python AI service are deployed as separate containers but explicitly bound to the **same ECS Task Definition**. This critical decision allows them to communicate securely over `localhost`, completely bypassing external networking latency and VPC routing overhead.
* **Persistent State (Amazon RDS)**: Application state, user profiles, and background task statuses are stored securely in an Amazon RDS PostgreSQL instance. Security groups restrict access strictly to the ECS task on port 5432.
* **Vector Storage (Amazon S3)**: FAISS indices, which can grow significantly for large repositories, are durably stored in a dedicated S3 bucket (`projectdna-faiss`). The ECS task is granted granular IAM policies (`s3:GetObject`, `s3:PutObject`) exclusively scoped to this bucket, allowing the Python service to rapidly pull index files into ephemeral storage during execution.
* **Secrets Management (AWS SSM)**: No secrets are passed in plaintext or stored in images. Sensitive configurations (DB Password, JWT Secret, GitHub Tokens, AI API Keys) are securely managed in AWS Systems Manager (SSM) Parameter Store as `SecureString` types. The ECS Task Execution Role dynamically resolves and injects them as environment variables only at runtime.

## API Endpoints

### AI Service (`ai-service/app.py`)
*All endpoints below are prefixed with the base URL of the AI service.*
* `GET /health` - Health check.
* `POST /index` - Indexes a repository for RAG.
* `POST /chat` - Chat agent for codebase Q&A.
* `POST /generate/documentation` - Generates technical documentation.
* `POST /generate/interview-questions` - Generates mock interview questions.
* `POST /generate/improvements` - Suggests codebase improvements.
* `POST /generate/architecture` - Analyzes architecture.
* `POST /generate/revision` - Generates revision notes.
* `POST /generate/recommendations` - Generates feature recommendations.
* `POST /generate/diagram` - Generates Mermaid diagrams.
* `POST /generate/quiz` - Generates a technical quiz.
* `POST /generate/deck` - Generates a presentation deck.

### Node.js Backend (`server/src/routes/`)
*All endpoints below are prefixed with `/api`.*
* **Auth:** `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/me`
* **Projects:** `POST /projects`, `GET /projects`, `GET /projects/:projectId`, `DELETE /projects/:projectId`
* **Invitations:** `GET /projects/invitations/pending`, `POST /projects/invitations/:projectId/accept`, `POST /projects/invitations/:projectId/decline`
* **Members:** `POST /projects/:projectId/members`
* **GitHub:** `POST /github`, `GET /github`
* **Tasks:** `GET /tasks`, `POST /tasks`, `PATCH /tasks/:taskId`, `DELETE /tasks/:taskId`
* **Notifications:** `GET /notifications`, `POST /notifications/:id/read`
* **AI Orchestration (`/projects/:projectId/ai`):** `POST /index`, `POST /chat`, `GET /chat/history`, `POST /generate/documentation`, `GET /documents`, `POST /generate/interview-questions`, `GET /interview-questions`, `POST /generate/improvements`, `POST /generate/architecture`, `GET /timeline`, `POST /feedback`, `GET /feedback`, `POST /experiences`, `GET /experiences`, `POST /generate/revision`, `POST /recommendations`, `POST /notes`, `GET /notes`, `DELETE /notes/:noteId`, `GET /health-score`, `POST /diff-analyze`, `POST /compress-memory`, `POST /generate/diagram`, `GET /diagrams`, `POST /generate/quiz`, `POST /generate/deck`
* **SSE:** `GET /sse` - Connect to Server-Sent Events for real-time task updates.

## Repository structure
```text
.
├── ai-service/          Python Flask service handling LLMs and FAISS retrieval
├── client/              React 18 frontend with Vite and TypeScript
├── server/              Node.js Express backend and API orchestration
├── terraform/           Infrastructure-as-Code for AWS ECS deployment
└── README.md            This file
```

## Reviewing this project
* Start with `terraform/main.tf` — specifically the "ECS Task Definition" section, since the co-location of the Node and Python containers drives the entire low-latency architecture.
* Cross-reference `server/src/routes/ai.js` to see exactly how the Node backend safely proxies requests and orchestrates tasks for the AI Python service.
* Open `ai-service/agents.py` to see how the Retrieval-Augmented Generation (RAG) system dynamically assembles context windows for complex developer questions without hallucinating.

## Validation
Run `npm run build` in the `client` directory to verify the frontend bundles correctly, and `npm run test` in the `server` directory to ensure backend endpoints are stable.

## Author
Built by Preethi with :)

