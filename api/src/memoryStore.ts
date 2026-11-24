import type { NewChunk, ScoredChunk, VectorStore } from "./types.js";

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

/** In-memory store: used for tests and local experiments. */
export class InMemoryStore implements VectorStore {
  private rows: (NewChunk & { id: number })[] = [];

  async add(chunks: NewChunk[]): Promise<void> {
    for (const c of chunks) this.rows.push({ ...c, id: this.rows.length + 1 });
  }

  async search(embedding: number[], opts: { packageName?: string; limit: number }) {
    return this.rows
      .filter((r) => !opts.packageName || r.packageName === opts.packageName)
      .map<ScoredChunk>((r) => ({
        id: r.id,
        packageName: r.packageName,
        version: r.version,
        source: r.source,
        content: r.content,
        score: cosine(embedding, r.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, opts.limit);
  }
}
