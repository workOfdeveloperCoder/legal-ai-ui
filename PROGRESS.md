# Project Progress Log

## Last Updated
Monday, Aug 24, 2026 (~10:47 PM PKT)

## Current State
- Streamed answers keep word spaces and wrap inside the bubble (`overflow-wrap: anywhere`). While tokens arrive, text is shown as pre-wrapped plain text so incomplete markdown cannot glue words or blow the layout.
- Dashboard “ask anything” creates a draft, opens the conversation, then auto-sends so thinking/tokens appear on the chat screen instead of blocking on the banner.
- Matter details still show chat cards from `GET /matters/{id}/conversations`.
- Documents count uses `GET /matters/{id}/documents`.
- Chat composer still shows **Context %** from backend usage metadata.
- Sidebar **Token Usage** uses the open chat's `token_usage` (or `GET /llm/status` at 0% before any send).
- Prompt mic is ChatGPT **dictate**: record in the composer → `POST /voice/transcribe` → text is inserted into the input.
- Resource cards still read `resources[]` on the completed stream payload.

## What Was Done This Session
- Wired `chatService.streamMessage` to `POST /chat/stream` and parse SSE (`started`, `status`, `thinking`, `token`, `complete`, `error`, keepalives).
- Chat transcript shows a ChatGPT-style thinking panel (shimmer + elapsed time) then live answer tokens.
- Fixed streamed answers overflowing the bubble and gluing words together (wrap + space joining + pre-wrap while streaming).
- Cache subscribe is ignored while a stream is in flight so token updates are not overwritten.
- Vite `/api` proxy read/write timeout is 3600s so a long R1 think phase is not cut at 120s when the UI is proxied.
- Dashboard start-chat navigates immediately with `pendingMessage`; ChatArea sends after load.
- SSE parser unit tests added (`src/lib/sse.test.js`). Vitest: **35 passed**.

### Files created/modified
- Created: `src/lib/sse.js`, `src/lib/sse.test.js`, `src/components/chat/ThinkingBlock.jsx`
- Modified: `src/services/chatService.js`, `src/components/chat/ChatArea.jsx`, `src/components/chat/ChatMessage.jsx`, `src/components/dashboard/StartChatBanner.jsx`, `src/index.css`, `vite.config.js`

## In Progress / Half Done
- Profile is view-only; no update-profile or change-password API yet.
- Live `/voice/transcribe` still depends on a reachable backend.
- Browser E2E of thinking + token stream still needs a signed-in session against a live legal-chatbot (R1 can take minutes).
- Restart `npm run dev` so the 3600s proxy timeout is picked up.

## Next Steps (Do This First When You Return)
1. Restart `npm run dev` on `feature/waqar`.
2. Open a chat and ask something like “What is Section 54-c?”
3. Confirm: shimmer **Thinking** / “Searching the legal corpus…” appears, then tokens stream, then the panel collapses to “Thought for Ns”.
4. Stop should abort the SSE request.

## Known Issues / Blockers
- DeepSeek R1 32B can think for several minutes before the first token; the UI now shows that phase instead of a frozen spinner.
- If Nginx sits in front of the API, it still needs `proxy_read_timeout 3600s` (legal-chatbot `docs/PRODUCTION.md`).
- legal-chatbot has **no** GET for library/legal corpus full text. Those cards can only show `resources[].evidence` excerpts until the backend adds an endpoint.
- Dictation is WAV ≤ 45s (backend limit). It is not live streaming STT.

## Key Decisions & Context
- Do not write localStorage on every token (too chatty + cache subscribe races). Persist at stream start and on complete.
- Thinking text is client-cache only; the conversation GET from the server does not return the hidden think trace.
- Prefer `ChatResponse.token_usage`; keep `retrieval_metadata.token_budget` as fallback.
- Resource cards are driven by `response.resources` only (no markdown citation parsing).
