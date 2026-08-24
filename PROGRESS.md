# Project Progress Log

## Last Updated
Monday, Aug 24, 2026 (~9:11 PM PKT)

## Current State
- Matter details show chat cards from `GET /matters/{id}/conversations`.
- Documents count uses `GET /matters/{id}/documents`.
- Chat composer still shows **Context %** from backend usage metadata.
- Sidebar **Token Usage** uses the open chat's `token_usage` (or `GET /llm/status` at 0% before any send). Covered by `sidebarTokenBudget.test.js`.
- Prompt mic is ChatGPT **dictate**: record in the composer → `POST /voice/transcribe` → text is inserted into the input.
- Profile page exists at `/profile` and loads account details from `GET /auth/me`.

## What Was Done This Session
- Replaced the ChatGPT voice-call overlay with in-prompt dictation.
- Added sidebar token-meter tests (BE `token_usage` → ring percent and `used / limit`).
- Stopped the open chat from showing another conversation's token usage.

### Files created/modified
- Created: `src/lib/sidebarTokenBudget.js`, `src/lib/sidebarTokenBudget.test.js`
- Modified: `src/components/dashboard/TokenUsageCard.jsx`

## In Progress / Half Done
- Profile is view-only; no update-profile or change-password API yet.
- Live `/voice/transcribe` still depends on a reachable backend (proxy has been timing out).

## Next Steps (Do This First When You Return)
1. Click the prompt mic, allow the microphone, speak, tap mic again.
2. Confirm transcript appears in the text box, then send with the arrow.
3. Esc should cancel listening without inserting text.

## Known Issues / Blockers
- Vite proxy to the chatbot host may time out; transcribe then fails with a red hint under the composer.
- Dictation is WAV ≤ 45s (backend limit). It is not live streaming STT.

## Key Decisions & Context
- Frontend never estimates tokens or blocks sends based on local math.
- Prefer `ChatResponse.token_usage`; keep `retrieval_metadata.token_budget` as fallback.
- Dictate only fills the prompt. Answers are not spoken.
