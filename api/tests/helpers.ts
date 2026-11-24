import type { Embedder, LLM } from "../src/types.js";

const DIM = 512;

/** Deterministic bag-of-words embedding so tests need no network. */
export function hashEmbed(text: string): number[] {
  const v = new Array<number>(DIM).fill(0);
  for (const w of text.toLowerCase().match(/[a-z0-9]+/g) ?? []) {
    let h = 0;
    for (const c of w) h = (h * 31 + c.charCodeAt(0)) % DIM;
    v[h] += 1;
  }
  const n = Math.hypot(...v) || 1;
  return v.map((x) => x / n);
}

export const fakeEmbedder: Embedder = {
  embed: async (texts) => texts.map(hashEmbed),
};

export function fakeLLM() {
  const calls: { system: string; user: string }[] = [];
  const llm: LLM = {
    answer: async (system, user) => {
      calls.push({ system, user });
      return "It was removed; use promises instead [1].";
    },
  };
  return { llm, calls };
}
