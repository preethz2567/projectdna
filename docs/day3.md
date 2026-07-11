# ProjectDNA — Day 3: React Frontend & Workspace UI

**Date:** July 11, 2026
**Goal:** Build the complete React frontend UI, integrate it with the Day 1/2 backend APIs, and ensure a seamless user experience across the entire workspace.

--

## What I Built

### 1. Core Application Shell (`index.css` & `useStore.ts`)
Established the foundational architecture for the client application.
- **Design System (`index.css`)**: Built a comprehensive, sleek, and modern UI system from scratch using raw CSS variables (no bloated libraries). Included micro-animations, glassmorphism hints, and a consistent color palette tailored for developers.
- **State Management (`useStore.ts`)**: Implemented Zustand for lightweight, global state management to handle the user session, JWT token persistence, and the currently active project context without prop drilling.

### 2. Authentication Flow (`Login.tsx`, `Register.tsx`, `ProtectedRoute.tsx`)
Wired up the entry points for the platform.
- Clean, minimal login and registration forms interacting with the `api/auth.ts` service.
- **Protected Routing**: Implemented a `<ProtectedRoute>` wrapper ensuring unauthenticated users are redirected to `/login` immediately.

### 3. Dashboard & Project Creation (`Dashboard.tsx`)
The central hub for users when they log in.
- Displays a responsive grid of all projects a user has access to, including their specific role (owner, member, mentor).
- Integrated a project creation modal that triggers the `POST /projects` API, automatically setting up the owner and initializing the project timeline.

### 4. Comprehensive Workspace Module (`WorkspaceLayout.tsx`)
The core interface of the platform. Built a persistent sidebar shell with seamless `react-router-dom` nested routing spanning 9 distinct sections:

| Section | Component | Description |
|---------|-----------|-------------|
| **Overview** | `Overview.tsx` | High-level summary of the project's vision, team size, and quick actions. |
| **Repository** | `Repository.tsx` | UI to paste a GitHub URL and trigger the backend RAG indexing pipeline. |
| **Tasks** | `Tasks.tsx` | Drag-free, click-to-move Kanban board with **live Server-Sent Events (SSE)** syncing status updates instantly across all connected clients. |
| **AI Chat** | `Chat.tsx` | Interactive chat window communicating directly with the `llm.py` RAG agent, complete with auto-scrolling and context-aware responses. |
| **Interview** | `InterviewPrep.tsx` | Topic-based Q&A bank (Technical, Architecture, HR) with difficulty badges, powered by the Interview Agent. |
| **Documents** | `Documents.tsx` | Viewer for AI-generated project documentation (README, API Docs, Deployment guides). |
| **Feedback** | `Feedback.tsx` | Collaborative area for mentors to leave categorized, structured feedback for the team. |
| **Timeline** | `Timeline.tsx` | Chronological feed of major project milestones (creation, indexing, repo connection). |
| **Team** | `Members.tsx` | Member management table showing user roles. Includes a modal to securely invite new members or mentors. |

---

## Backend Fixes & API Integration

While integrating the frontend, several crucial backend adjustments were made to ensure stability:

1. **SSE Authentication Fix:** EventSource in browsers does not support sending custom headers (like `Authorization: Bearer token`). Updated `server/src/routes/sse.js` to securely accept the JWT via a query parameter (`?token=...`) as a fallback.
2. **Member Invitation Constraints:** The database strictly enforces roles (`owner`, `member`, `mentor`) via a PostgreSQL `CHECK` constraint. 
   - Fixed a bug where inviting an "admin" caused a silent DB failure. 
   - Updated the API to gracefully default to `member` and ignore case-sensitivity on emails.
   - Updated the UI dropdown to only offer valid DB roles ("Member", "Mentor").
3. **TypeScript Safety:** Configured `client/vite.config.ts` proxy to route `/api` to `localhost:3001` and resolved all `tsc` compilation warnings.

--

## Test Results

### 1. Kanban Live Syncing (SSE)
- Opening the app in two separate browser windows and moving a task from "To Do" to "Done" in Window A instantly reflects the change in Window B without refreshing.

### 2. Full AI Pipeline
- Clicking "Generate Architecture Questions" in the Interview Prep tab correctly triggers the Python Flask service, updates PostgreSQL, and invalidates the TanStack query to immediately render the new questions in the UI.

### 3. Cross-role Access
- Inviting a mentor to the project immediately grants them access to the dashboard. Logging in as the mentor correctly displays their `project_role` as "mentor".

--

## Files Created / Modified Today

```
client/
├── src/
│   ├── api/          [NEW] ← Axios wrappers for auth, projects, and ai endpoints
│   ├── components/   [NEW] ← Layout wrappers, ProtectedRoute, MarkdownRenderer
│   ├── pages/        [NEW] ← Login, Register, Dashboard, and 9 Workspace components
│   ├── store/        [NEW] ← Zustand state management
│   ├── App.tsx       [MOD] ← React Router setup
│   ├── index.css     [MOD] ← Complete CSS design system
│   └── main.tsx      [MOD] ← TanStack Query Provider setup
└── vite.config.ts    [MOD] ← Added API proxy configuration

server/
├── src/
│   ├── routes/
│   │   ├── sse.js      [MOD] ← Added query param token support
│   │   └── projects.js [MOD] ← Fixed constraint handling in inviteMember
└── test scripts      [NEW] ← Node scripts for DB debugging and password resets
```

--

## Issues Encountered & Resolved

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Chrome "Password Breach" Warning | Chrome intercepts common test passwords (e.g., `password123`). | Clarified it was a browser feature, wiped DB, and utilized secure test passwords. |
| Silently failing member invites | UI sent "Admin" role which violated Postgres `CHECK` constraint. | Updated frontend dropdown to "Mentor" and added safe fallbacks in the Express route. |
| `vite build` failure | Unused variables and raw backslash escapes in template strings. | Linted code and removed unused vars/fixed syntax prior to deployment build. |

--

## What's Next — Day 4

- [ ] End-to-end user acceptance testing (UAT).
- [ ] UI Polish (fixing any edge case alignments, empty states, and loading spinners).
- [ ] Deployment to production (Vercel for frontend, Render/Railway for backend services).
- [ ] Final Presentation Preparation.
