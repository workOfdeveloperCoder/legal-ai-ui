# Project Progress Log

## Last Updated
Tuesday, Aug 25, 2026 — ~7:10 PM (UTC+5)

## Current State
- Branch: `feature/yasir`
- Contract analysis UI wired into chat
- Sidebar conversation menu: **Rename** + **Delete** call `PATCH/DELETE /conversations/{id}`

## What Was Done This Session
- Wired sidebar Rename/Delete in `MattersMenu.jsx`
- Added `chatService.renameConversation` / `deleteConversation`
- Cache helpers `renameCachedConversation` / `removeCachedConversation`
- Backend: `PATCH` + `DELETE /api/v1/conversations/{id}` (service methods already existed)

## Next Steps
1. Restart LegalGPT API so PATCH/DELETE routes load
2. Hover a chat → ⋯ → Rename / Delete

## Current State
- Branch: `feature/yasir`
- Contract analysis UI is wired into chat: clause cards, review table, playbook findings, redline HTML, DOCX download
- Empty-state and dashboard quick actions load from `GET /chat/quick-actions` (with offline fallback)
- Chat send/stream passes `quick_action` / `web_search` when a card is clicked
- Artifacts stay in the client conversation cache after stream complete

## What Was Done This Session
- Added `src/services/contractsService.js` (quick actions, export blob download, artifact pick helpers)
- Added `src/components/chat/ContractArtifacts.jsx` (clause cards, review table, playbook, redline + DOCX)
- Mapped `clauseCards` / `reviewTable` / `playbookReview` / `redline` in `chatService` send + stream complete
- EmptyState shows 6 catalog cards + Contract tools (review table / playbook / redline)
- Dashboard QuickActions start a draft chat with `pendingMessage` + `pendingQuickAction`
- ChatArea forwards pending quick action into `streamMessage`

### Files created/modified
- Created: `src/services/contractsService.js`, `src/components/chat/ContractArtifacts.jsx`
- Modified: `src/services/chatService.js`, `src/services/dashboardService.js`, `src/components/chat/ChatMessage.jsx`, `src/components/chat/ChatArea.jsx`, `src/components/chat/EmptyState.jsx`, `src/components/dashboard/QuickActions.jsx`, `PROGRESS.md`

## In Progress / Half Done
- Browser E2E against a live legal-chatbot with a real contract upload not verified in this session
- Vitest could not run here due to local sandbox EPERM on `node_modules/.vite-temp`

## Next Steps (Do This First When You Return)
1. Restart API (`pip install -r requirements.txt` if needed) and `npm run dev` on `feature/yasir`
2. Upload a contract → **Analyze a Contract** → confirm clause cards + DOCX
3. Try **Playbook Review**, **Redline**, **Review Table** from Contract tools
4. Confirm dashboard quick-action cards open a chat and auto-send with the slug

## Known Issues / Blockers
- Artifacts are client-cache only; reloading from `GET /conversations/{id}` does not restore clause cards unless they were cached
- Document-required actions still ask for upload when no file is attached (by design)

## Key Decisions & Context
- Match existing yellow/slate chat bubble styling rather than a new design system
- Hidden contract tools are shown under EmptyState even though they are not in the 6-card API catalog
- Export uses `POST /contracts/export` with a blob download
---
