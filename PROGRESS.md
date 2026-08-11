# Project Progress Log

## Last Updated
Tuesday, Aug 11, 2026 (~7:20 PM PKT)

## Current State
- `legal-ai-ui` is wired to the real `legal-chatbot` FastAPI (`/api/v1`) for auth, chat, matters, and document upload.
- Chat UI works against `POST /api/v1/chat` with richer **Resources** from Qdrant/legal-gpt chunks (title, law, court, year, excerpt, keywords, score).
- No streaming — backend returns a single JSON `ChatResponse`.
- Conversation list/history HTTP APIs are still missing; UI uses localStorage cache.
- Dashboard cards tolerate empty mock data.
- Local Vite proxy: `/api` → `http://localhost:8000`.

## What Was Done This Session
- Integrated Legal Chatbot APIs into legal-ai-ui (auth, chat, matters, documents).
- Fixed matter create transaction bug (`db.begin()` on already-open session).
- Fixed dashboard null `.map` crash.
- Enriched citations from legal-gpt Qdrant chunks with readable excerpts + metadata for UI Resources.

### Files created/modified
- Created: `src/lib/apiClient.js`, `src/lib/conversationStore.js`, `src/services/documentService.js`, `src/components/auth/LoginPage.jsx`, `.env.example`, `.env`
- Modified: `vite.config.js`, `src/services/auth.js`, `chatService.js`, `matterService.js`, `dashboardService.js`, `App.jsx`, chat/layout/dashboard/matter components, `AppRoutes.jsx`, `.gitignore`

## In Progress / Half Done
- Paperclip upload UI is not wired to `documentService` yet (needs matter context in chat).
- Matter page redirects into a conversation rather than embedding ChatArea in-place.
- Full-repo `eslint .` still reports pre-existing unused-import issues in untouched matter files.

## Next Steps (Do This First When You Return)
1. Run `legal-chatbot` on `:8000` and `legal-ai-ui` with `npm run dev`; register/login and send a chat.
2. Optionally add backend routes for conversation list + message history (service methods already exist).
3. Add production CORS on `legal-chatbot` if not using a reverse proxy.
4. Wire document upload from the chat paperclip when a matter is linked.
5. Optionally load real matters into the dashboard My Matters card from `/matters`.

## Known Issues / Blockers
- Backend has **no** `GET /conversations` or history routes — sidebar/history rely on localStorage.
- Backend has **no** CORS middleware — local Vite proxy works; production needs CORS or same-origin proxy.
- Chat requests can be long-running (LLM); UI supports abort on the client only.
- Dashboard cards empty unless json-server mock is running on `VITE_MOCK_API_URL`.

## Key Decisions & Context
- Keep `legal-ai-ui` as the primary frontend architecture; use `legal-chatbot` as the API reference only.
- Do not invent streaming — backend uses non-streaming Ollama calls.
- Bridge missing conversation list/history with client cache rather than inventing fake endpoints.
- Auth uses JWT access + refresh tokens from `legal-chatbot`.
- Env: `VITE_API_BASE_URL=/api/v1`, `VITE_MOCK_API_URL` optional for dashboard.
