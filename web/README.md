# VerDrift Web

React + TypeScript + Vite frontend for the VerDrift API.

## Run
1. Start the API (`npm run dev` in the backend folder, port 3000).
2. In this folder: `npm install` then `npm run dev`, and open http://localhost:5173.

Vite proxies `/api` and `/health` to `http://127.0.0.1:3000`, so no CORS setup is needed in development.

## Behavior
- One request at a time: a new question aborts the previous in-flight request (`AbortController`).
- States: idle, loading, success, error. A refusal (no relevant sources) is shown as a notice, not an error.
- "Add release notes" panel calls `POST /api/ingest`.
