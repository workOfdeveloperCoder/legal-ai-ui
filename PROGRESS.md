# Project Progress Log

## Last Updated
Wednesday, Aug 19, 2026 (~5:52 PM PKT)

## Current State
- Matter details show chat cards from `GET /matters/{id}/conversations`.
- Documents count uses `GET /matters/{id}/documents`.
- Chat composer shows a subtle **Context %** indicator driven by backend `token_budget` (no frontend token counting).
- Typing indicator uses Scale law icon while waiting for replies.
- Header avatar opens a dropdown with Profile and Logout (no chevron).
- Header search is left-aligned; bell and avatar stay on the right.
- Profile page exists at `/profile` and loads account details from `GET /auth/me`.

## What Was Done This Session
- Built a read-only Profile page (`src/components/profile/Profile.jsx`) showing name, email, username, role, verified/active.
- Wired `/profile` in `src/routes/AppRoutes.jsx`.
- Fixed blank Profile page: component used `initialUser` without accepting it as a prop (`function Profile()`), which crashed React with `ReferenceError: initialUser is not defined`.

### Files created/modified
- Created: `src/components/profile/Profile.jsx`
- Modified: `src/routes/AppRoutes.jsx`
- Modified: `src/components/layout/Header.jsx` (search left, actions right)

## In Progress / Half Done
- Profile is view-only; no update-profile or change-password API yet.

## Next Steps (Do This First When You Return)
1. Open `/profile` and confirm name/email/role render (no blank page).
2. Add profile edit / change password if the backend supports it.
3. Send a real chat and confirm Network response includes `token_budget`.

## Known Issues / Blockers
- Without `token_budget` in the response, indicator correctly hides (by design).
- No `PATCH` user endpoint in the frontend, so Profile cannot save edits yet.

## Key Decisions & Context
- Frontend never estimates tokens or blocks sends based on local math.
- Backend TokenBudgetManager remains the only enforcement/trim authority.
- Avatar itself is the menu trigger; no extra arrow control.
- Profile reads from `GET /auth/me` and falls back to the `user` prop from App.
