import type { Pool } from "pg";
import type { NewChunk, ScoredChunk, VectorStore } from "./types.js";

const toVector = (v: number[]) => `[${v.join(",")}]`;

export class PgVectorStore implements VectorStore {
  constructor(private pool: Pool) {}

  async add(chunks: NewChunk[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      for (const c of chunks) {
        await client.query(
          `INSERT INTO chunks (package_name, version, source, content, embedding)
           VALUES ($1, $2, $3, $4, $5::vector)`,
          [c.packageName, c.version, c.source, c.content, toVector(c.embedding)]
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async search(embedding: number[], opts: { packageName?: string; limit: number }) {
    const { rows } = await this.pool.query(
      `SELECT id, package_name, version, source, content,
              1 - (embedding <=> $1::vector) AS score
       FROM chunks
       WHERE ($2::text IS NULL OR package_name = $2)
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      [toVector(embedding), opts.packageName ?? null, opts.limit]
    );
    return rows.map<ScoredChunk>((r) => ({
      id: Number(r.id),
      packageName: r.package_name,
      version: r.version,
      source: r.source,
      content: r.content,
      score: Number(r.score),
    }));
  }
}
