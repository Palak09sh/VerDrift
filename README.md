# VerDrift

Ask "will upgrading this package break my code?" and get an answer grounded in real release notes, with citations.

RAG pipeline: release notes are chunked, embedded, stored in Postgres (pgvector), retrieved by similarity, and summarized by an LLM that must cite its sources and refuses when retrieval is weak.

## Architecture

```
POST /api/ingest  -> chunk -> embed -> pgvector (chunks table)
POST /api/ask     -> embed question -> top-k similarity search (optionally per package)
                  -> below MIN_SCORE? refuse (no LLM call)
                  -> else LLM answers from numbered sources, citing [n]
```

- `src/rag.ts` holds the pipeline. Embedder, vector store, and LLM are interfaces (`src/types.ts`), so tests run on fakes with no network.
- `src/pgStore.ts` is the production store. `src/memoryStore.ts` is the in-memory one used in tests.

## Free options (no paid API keys)

The defaults in `.env.example` use Ollama locally for both embeddings and answers, so nothing is billed. Install Ollama, run `ollama pull nomic-embed-text` and `ollama pull llama3.2`, then copy `.env.example` to `.env`. Gemini (free key) also works through its OpenAI-compatible endpoint; Anthropic is optional (`LLM_PROVIDER=anthropic`).

## Run it

```bash
cp .env.example .env        # defaults use free local Ollama
docker compose up -d db     # Postgres + pgvector, schema auto-applied
npm install
npm run dev
npm run ingest -- libx 5.0.0 ./CHANGELOG.md
curl -X POST localhost:3000/api/ask -H 'content-type: application/json' \
  -d '{"question":"Was the legacy callback API removed?","packageName":"libx"}'
```

Scripts load `.env` automatically (Node 20.6+).

Tests: `npm test` (no network or database needed).

## Status

Done: ingestion, retrieval, cited answers with refusal, validation, tests.
Not done yet: auth, post/vote CRUD, frontend, CI, deployment.
