# Project Progress Log

## Last Updated
Monday, Aug 24, 2026 (~9:30 PM PKT)

## Current State
- Matter details show chat cards from `GET /matters/{id}/conversations`.
- Documents count uses `GET /matters/{id}/documents`.
- Chat composer still shows **Context %** from backend usage metadata.
- Sidebar **Token Usage** uses the open chat's `token_usage` (or `GET /llm/status` at 0% before any send). Covered by `sidebarTokenBudget.test.js`.
- Prompt mic is ChatGPT **dictate**: record in the composer → `POST /voice/transcribe` → text is inserted into the input.
- Profile page exists at `/profile` and loads account details from `GET /auth/me`.
- Resource cards read **only** `POST /chat` `resources[]`. Opening a card GETs full text when the chatbot exposes it, and otherwise shows the retrieved `evidence[]` passage (no empty “Load failed” modal).

## What Was Done This Session
- Replaced the ChatGPT voice-call overlay with in-prompt dictation.
- Added sidebar token-meter tests (BE `token_usage` → ring percent and `used / limit`).
- Stopped the open chat from showing another conversation's token usage.
- Fixed the resource document modal:
  - Implemented `documentService.getDocument` against
    `GET /api/v1/documents/conversations/{conversation_id}/document/{document_id}` and
    `GET /api/v1/matters/{matter_id}/document/{document_id}`.
  - Implemented `documentService.getMatterDocuments` against
    `GET /api/v1/matters/{matter_id}/documents`.
  - Do not call those GETs for library/legal corpus files (no such endpoint on legal-chatbot).
  - Do not borrow the open chat’s conversation id for matter/library cards.
  - Keep retrieved excerpts visible even when full-text GET 404s.
  - Pointed local proxy at `http://172.16.112.49:8000`.

### Files created/modified
- Created: `src/lib/documentFetch.js`, `src/lib/documentFetch.test.js`
- Modified: `src/services/documentService.js`, `src/components/chat/DocumentSourcePanel.jsx`, `src/components/chat/ChatMessage.jsx`, `src/services/chatService.js`, `.env`

## In Progress / Half Done
- Profile is view-only; no update-profile or change-password API yet.
- Live `/voice/transcribe` still depends on a reachable backend.
- Vite may still be running with the old proxy host until the dev server is restarted.

## Next Steps (Do This First When You Return)
1. Restart `npm run dev` so the proxy uses `172.16.112.49:8000`.
2. Open a chat answer with Resources cards.
3. Click a conversation/matter upload → modal should load full text and yellow-highlight `start_offset`/`end_offset`.
4. Click a library/legal file (e.g. `2000J8.txt`) → modal should show the verbatim retrieved passage, not a red “Load failed” banner.

## Known Issues / Blockers
- legal-chatbot has **no** GET for library/legal corpus full text. Those cards can only show `resources[].evidence` excerpts until the backend adds an endpoint.
- If the backend tags a corpus file as `source_type: conversation`, the UI will try the conversation GET, get 404, and fall back to the excerpt.
- Dictation is WAV ≤ 45s (backend limit). It is not live streaming STT.

## Key Decisions & Context
- Frontend never estimates tokens or blocks sends based on local math.
- Prefer `ChatResponse.token_usage`; keep `retrieval_metadata.token_budget` as fallback.
- Dictate only fills the prompt. Answers are not spoken.
- Resource cards are driven by `response.resources` only (no markdown citation parsing).
- Do not change legal-chatbot; UI only uses existing GET routes.
