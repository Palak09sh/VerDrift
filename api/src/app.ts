import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { ask, ingest } from "./rag.js";
import type { Deps } from "./types.js";

const ingestSchema = z.object({
  packageName: z.string().min(1),
  version: z.string().min(1),
  source: z.string().min(1),
  text: z.string().min(1).max(200_000),
});

const askSchema = z.object({
  question: z.string().min(3).max(1000),
  packageName: z.string().min(1).optional(),
});

export function createApp(deps: Deps) {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.post("/api/ingest", async (req, res, next) => {
    try {
      const doc = ingestSchema.parse(req.body);
      const chunks = await ingest(deps, doc);
      res.status(201).json({ chunks });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/ask", async (req, res, next) => {
    try {
      const q = askSchema.parse(req.body);
      res.json(await ask(deps, q));
    } catch (err) {
      next(err);
    }
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "validation_error", issues: err.issues });
    }
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  });

  return app;
}
