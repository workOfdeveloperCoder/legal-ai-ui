# Project Progress Log

## Last Updated
Wednesday, Aug 12, 2026 (~11:25 PM PKT)

## Current State
- Matter details show chat cards from `GET /matters/{id}/conversations`.
- Documents count uses `GET /matters/{id}/documents`.
- Chat composer shows a subtle **Context %** indicator driven by backend `token_budget` (no frontend token counting).
- Typing indicator uses Scale law icon while waiting for replies.

## What Was Done This Session
- Added `tokenBudget` normalization from `/chat` (`token_budget` or `retrieval_metadata.token_budget`).
- Added `ContextUsageIndicator` near PromptBar with hover breakdown.
- Show trim notice when `trimmed: true`.
- Map context-limit API failures to a professional lawyer-facing message.
- Added Vitest suite for usage levels, trimmed, missing budget, legacy responses, and errors.

### Files created/modified
- Created: `src/lib/tokenBudget.js`, `src/lib/tokenBudget.test.js`, `src/components/chat/ContextUsageIndicator.jsx`, `vitest.config.js`
- Modified: `src/services/chatService.js`, `src/components/chat/ChatArea.jsx`, `src/components/chat/PromptBar.jsx`, `package.json`

## In Progress / Half Done
- Live OpenAPI still nests `token_budget` under `retrieval_metadata` (frontend supports that). Optional backend improvement: also expose top-level `ChatResponse.token_budget`.

## Next Steps (Do This First When You Return)
1. Send a real chat and confirm Network response includes `retrieval_metadata.token_budget` / top-level `token_budget`.
2. If indicator stays hidden, ask backend to populate TokenBudgetManager fields on every `/chat` response.
3. Optionally promote `token_budget` to top-level ChatResponse for clarity.

## Known Issues / Blockers
- Without `token_budget` in the response, indicator correctly hides (by design).

## Key Decisions & Context
- Frontend never estimates tokens or blocks sends based on local math.
- Backend TokenBudgetManager remains the only enforcement/trim authority.
