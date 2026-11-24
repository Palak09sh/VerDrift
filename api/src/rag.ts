import { chunkText } from "./chunk.js";
import type { Deps } from "./types.js";

export const TOP_K = 5;
/** Below this similarity we refuse to answer instead of letting the LLM guess. */
export const MIN_SCORE = 0.25;

const SYSTEM = `You help developers judge whether upgrading a package will break their code.
Answer ONLY from the numbered sources provided. Cite them like [1] or [2].
If the sources do not contain the answer, say you could not find it. Never invent changes.`;

export interface IngestDoc {
  packageName: string;
  version: string;
  source: string;
  text: string;
}

export async function ingest(deps: Deps, doc: IngestDoc): Promise<number> {
  const pieces = chunkText(doc.text);
  if (pieces.length === 0) return 0;
  const embeddings = await deps.embedder.embed(pieces);
  await deps.store.add(
    pieces.map((content, i) => ({
      packageName: doc.packageName,
      version: doc.version,
      source: doc.source,
      content,
      embedding: embeddings[i],
    }))
  );
  return pieces.length;
}

export async function ask(deps: Deps, q: { question: string; packageName?: string }) {
  const [queryEmbedding] = await deps.embedder.embed([q.question]);
  const hits = (
    await deps.store.search(queryEmbedding, { packageName: q.packageName, limit: TOP_K })
  ).filter((h) => h.score >= MIN_SCORE);

  if (hits.length === 0) {
    return {
      answer: "I couldn't find anything relevant in the ingested release notes.",
      sources: [],
    };
  }

  const context = hits
    .map((h, i) => `[${i + 1}] (${h.packageName}@${h.version}, ${h.source})\n${h.content}`)
    .join("\n\n");
  const answer = await deps.llm.answer(SYSTEM, `Sources:\n${context}\n\nQuestion: ${q.question}`);

  return {
    answer,
    sources: hits.map((h, i) => ({
      n: i + 1,
      packageName: h.packageName,
      version: h.version,
      source: h.source,
      score: Number(h.score.toFixed(3)),
    })),
  };
}
