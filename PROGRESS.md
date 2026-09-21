# Project Progress Log

## Last Updated
Wednesday, Sep 9, 2026 — ~9:50 PM (UTC+5)

## Current State
- Branch: `feature/yasir`
- Contract analysis UI is wired into chat
- Mic/dictation no longer crashes when `navigator.mediaDevices` is missing (Safari HTTP / insecure context)

## What Was Done This Session
- Fixed mic error `undefined is not an object (evaluating 'navigator.mediaDevices.getUserMedia')`
- `startWavRecorder` now checks for `getUserMedia` (plus webkit/moz fallback) before calling it
- Safari `webkitAudioContext` fallback added
- Voice errors explain HTTPS / unsupported browser instead of dumping the TypeError
- Mic button tooltip reflects why recording is unavailable

### Files created/modified
- Modified: `src/lib/recordWav.js`, `src/services/voiceService.js`, `src/components/chat/PromptBar.jsx`
- Created: `src/lib/recordWav.test.js`, `src/services/voiceService.test.js`

## In Progress / Half Done
- Live mic in Safari on a LAN `http://` IP still cannot record until the app is served over HTTPS (browser security, not a code bug)

## Next Steps (Do This First When You Return)
1. Open the app on **localhost** or **https://** in Chrome/Safari (not a plain `http://192.168.x.x` URL)
2. Tap the mic, allow permission, confirm dictation
3. If you must use a phone on the LAN, run Vite with HTTPS (self-signed cert) and accept the certificate

## Known Issues / Blockers
- `getUserMedia` is blocked on insecure origins (HTTP that is not localhost)
- Cursor’s embedded browser often has no `mediaDevices` — use Chrome or Safari
- Artifacts are still client-cache only after conversation reload

## Key Decisions & Context
- Do not call `navigator.mediaDevices.getUserMedia` until the API exists
- Keep HTTP Vite by default; HTTPS is only required when opening from a non-localhost host
