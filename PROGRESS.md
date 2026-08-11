# Project Progress Log

## Last Updated
Tuesday, Aug 11, 2026 (~11:35 PM PKT)

## Current State
- Document-scoped summarization/Q&A is implemented end-to-end across `legal-chatbot` + `legal-ai-ui`.
- Upload returns `document_id` (+ `vectorized`/`processed`); chat sends `document_id` for document questions.
- Document tasks query only `chatbot_documents` filtered by `document_id` + ownership; no `legal_documents` contamination.
- Empty extraction no longer marks documents processed/vectorized; chat fails clearly when a doc is not indexed.

## What Was Done This Session
- Added optional `document_id` to `ChatRequest`.
- Wired frontend upload → `document_id` → `POST /chat`.
- Fixed query routing (`has_uploaded_documents` + `document_id` precedence).
- Implemented strict document-scoped Qdrant retrieval and hard-stop on empty/foreign chunks.
- Fixed empty-extraction processing flags; improved PDF MIME/`octet-stream` handling.
- Added document-scope prompt instruction + retrieval debug logging.
- Tested upload, Qdrant isolation, ownership, empty/invalid docs, and RAG prompt purity (live deepseek-r1:32b summarize timed out on LLM latency).

### Files created/modified
**Backend (`legal-chatbot`)**
- `app/schemas/chat.py`, `app/schemas/document.py`
- `app/services/chat_service.py`, `app/services/document_service.py`
- `app/repositories/document_repository.py`
- `app/rag/qdrant_retriever.py`, `app/rag/rag_service.py`, `app/rag/repository.py`, `app/rag/prompt_builder.py`
- `app/vector/filters.py`
- `app/document/extractor.py`
- `app/api/dependencies/services.py`

**Frontend (`legal-ai-ui`)**
- `src/components/chat/ChatArea.jsx`
- `src/services/chatService.js`

## In Progress / Half Done
- Matter-header uploads do not yet auto-attach `document_id` into subsequent chat messages (conversation paperclip path does).

## Next Steps (Do This First When You Return)
1. Smoke-test UI: upload “Clog on Discretion” via paperclip, ask “Summarize this document,” confirm answer is document-pure (LLM may be slow with deepseek-r1:32b).
2. Optionally wire MatterHeader upload → store `activeDocumentId` for matter chats.
3. Consider a faster Ollama chat model for interactive latency.

## Known Issues / Blockers
- Live `/chat` with `deepseek-r1:32b` can exceed 3 minutes; retrieval isolation is verified independently of LLM latency.
- Older Qdrant points may still have `filename: null` (separate citation metadata issue; not isolation).

## Key Decisions & Context
- `document_id` is optional for backward compatibility; when present it forces document-aware task + isolated retrieval.
- Normal legal research without `document_id` still searches private docs + global `legal_documents`.
- Ownership failures return 404 (no existence leak); unindexed docs return 400 with a clear re-upload message.
