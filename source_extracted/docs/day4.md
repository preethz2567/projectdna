# Day 4: Intelligence & Growth — AI Agents and Interview Prep

Today was focused on integrating LLM intelligence (powered by OpenRouter and Gemma 3) deeply into the developer workflow. We transformed ProjectDNA from a standard project management tool into a platform that actively coaches developers for interviews and helps them decide what to build next.

## Core Features Built

### 1. The Interview Memory System (Experiences)
- **Goal**: Track every interview, hackathon, and presentation a developer goes through.
- **Implementation**: Created the `Experiences.tsx` workspace page and corresponding backend APIs.
- **Why it matters**: Developers forget what they were asked and what they failed on. Logging it immediately creates a dataset the AI can use later to prepare them.

### 2. The Revision Agent (`Revision.tsx`)
- **Goal**: Generate a personalized 10-minute interview prep guide.
- **Implementation**: We built `revision_agent` in Flask. It pulls RAG context (repository architecture, DB schema) + the user's past `experiences` and `questions_asked` to generate a tightly focused prep guide.
- **Why it matters**: It stops developers from scrambling to re-read their own code before an interview. The AI highlights their past weaknesses and expected architecture questions.

### 3. Global Project Recommendations (`Recommendations.tsx`)
- **Goal**: Answer the classic "what should I build next?" question.
- **Implementation**: A standalone page outside individual workspaces. It aggregates the tech stack from *all* of the user's projects and sends it to `recommendations_agent`. The agent suggests 4 projects that build on existing knowledge but introduce exactly *one* new concept.
- **Why it matters**: It acts as a senior engineer guiding a junior's learning path.

### 4. Code Improvements (`Improvements.tsx`)
- **Goal**: Automated code review.
- **Implementation**: We added an endpoint that pulls repository data and asks the AI to evaluate security, performance, code quality, and deployment strategies.
- **Why it matters**: Teaches best practices and helps developers improve their portfolio pieces before applying for jobs.

### 5. Personal Notes (`Notes.tsx`)
- **Goal**: Allow users to jot down quick ideas, snippets, or bugs.
- **Implementation**: Standard CRUD interface with PostgreSQL backend storage tied to a specific project.

## Technical Details

### Fixing the Python Import Mismatch
While migrating the `revision_agent` and `recommendations_agent` to `agents.py`, we encountered a 500 Internal Server Error. 
- **The Bug**: `Flask` was throwing an `ImportError` because the new functions were missing or the file wasn't reloaded (`debug=False`). 
- **The Fix**: We correctly appended the functions to the bottom of `ai-service/agents.py` and rebooted the Flask server, ensuring `server/src/routes/ai.js` (via Axios) correctly received the AI payloads.

### UI Polish
- Updated `WorkspaceLayout.tsx` to include the new Routes and Sidebar navigation links (`◉ Experiences`, `◈ Improvements`, `◫ Revision`, `◻ Notes`).
- Updated `App.tsx` for the protected global `/recommendations` route.
- Added a "◈ What to build next" button inside `Dashboard.tsx`.

## What's Next — Day 5
- Polish UI aesthetics and responsive design.
- Final user acceptance testing (UAT).
- Prepare deployment documentation and presentation.
