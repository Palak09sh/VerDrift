import { z } from "zod";

const schema = z
  .object({
    DATABASE_URL: z.string().min(1),
    EMBEDDING_API_URL: z.string().url(),
    EMBEDDING_API_KEY: z.string().min(1),
    EMBEDDING_MODEL: z.string().min(1),
    LLM_PROVIDER: z.enum(["anthropic", "openai"]).default("openai"),
    /** required when LLM_PROVIDER=openai (any OpenAI-compatible endpoint) */
    LLM_API_URL: z.string().url().optional(),
    LLM_API_KEY: z.string().min(1),
    LLM_MODEL: z.string().min(1),
    PORT: z.coerce.number().default(3000),
  })
  .refine((c) => c.LLM_PROVIDER !== "openai" || !!c.LLM_API_URL, {
    message: "LLM_API_URL is required when LLM_PROVIDER=openai",
    path: ["LLM_API_URL"],
  });

export const loadConfig = () => schema.parse(process.env);
