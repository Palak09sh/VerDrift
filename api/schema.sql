CREATE EXTENSION IF NOT EXISTS vector;

-- vector(768) matches Ollama nomic-embed-text. If you change the
-- embedding model, change this dimension to match (e.g. 1536 for OpenAI text-embedding-3-small).
CREATE TABLE IF NOT EXISTS chunks (
  id           BIGSERIAL PRIMARY KEY,
  package_name TEXT NOT NULL,
  version      TEXT NOT NULL,
  source       TEXT NOT NULL,
  content      TEXT NOT NULL,
  embedding    vector(768) NOT NULL
);

CREATE INDEX IF NOT EXISTS chunks_embedding_idx
  ON chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS chunks_package_idx ON chunks (package_name);
