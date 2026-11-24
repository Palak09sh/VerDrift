import pg from "pg";
import { loadConfig } from "./config.js";
import { OpenAICompatibleEmbedder } from "./embed.js";
import { AnthropicLLM, OpenAICompatibleLLM } from "./llm.js";
import { PgVectorStore } from "./pgStore.js";
import type { Deps } from "./types.js";

export function buildDeps() {
  const cfg = loadConfig();
  const pool = new pg.Pool({ connectionString: cfg.DATABASE_URL });
  const llm =
    cfg.LLM_PROVIDER === "anthropic"
      ? new AnthropicLLM({ apiKey: cfg.LLM_API_KEY, model: cfg.LLM_MODEL })
      : new OpenAICompatibleLLM({ url: cfg.LLM_API_URL!, apiKey: cfg.LLM_API_KEY, model: cfg.LLM_MODEL });
  const deps: Deps = {
    embedder: new OpenAICompatibleEmbedder({
      url: cfg.EMBEDDING_API_URL,
      apiKey: cfg.EMBEDDING_API_KEY,
      model: cfg.EMBEDDING_MODEL,
    }),
    store: new PgVectorStore(pool),
    llm,
  };
  return { deps, pool, port: cfg.PORT };
}
