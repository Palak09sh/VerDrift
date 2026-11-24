import type { Embedder } from "./types.js";

const trimSlash = (u: string) => u.replace(/\/+$/, "");

/** Works with any OpenAI-compatible /embeddings endpoint (OpenAI, Gemini, Ollama...). */
export class OpenAICompatibleEmbedder implements Embedder {
  constructor(private o: { url: string; apiKey: string; model: string }) {}

  async embed(texts: string[]): Promise<number[][]> {
    const res = await fetch(`${trimSlash(this.o.url)}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.o.apiKey}`,
      },
      body: JSON.stringify({ model: this.o.model, input: texts }),
    });
    if (!res.ok) throw new Error(`Embedding API ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { data: { embedding: number[]; index: number }[] };
    return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
  }
}
