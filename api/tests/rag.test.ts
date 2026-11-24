import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { chunkText } from "../src/chunk.js";
import { InMemoryStore } from "../src/memoryStore.js";
import { ask, ingest } from "../src/rag.js";
import { fakeEmbedder, fakeLLM } from "./helpers.js";

const NOTES = `Breaking: the legacy callback API was removed. Use the promise API instead.

Added: new streaming helper for large responses.

Fixed: a memory leak in the connection pool.`;

function setup() {
  const { llm, calls } = fakeLLM();
  const deps = { embedder: fakeEmbedder, store: new InMemoryStore(), llm };
  return { deps, calls };
}

describe("chunkText", () => {
  it("keeps short text in one chunk", () => {
    expect(chunkText("one\n\ntwo")).toHaveLength(1);
  });
  it("splits long text and respects the size bound", () => {
    const long = Array.from({ length: 40 }, (_, i) => `paragraph ${i} `.repeat(10)).join("\n\n");
    const chunks = chunkText(long, 500, 50);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.length <= 1100)).toBe(true);
  });
});

describe("retrieval quality", () => {
  it("returns the known breaking-change chunk first", async () => {
    const { deps } = setup();
    await ingest(deps, { packageName: "libx", version: "5.0.0", source: "CHANGELOG.md", text: NOTES });
    const [q] = await deps.embedder.embed(["Was the legacy callback API removed?"]);
    const hits = await deps.store.search(q, { limit: 3 });
    expect(hits[0].content).toContain("legacy callback API was removed");
  });
});

describe("ask()", () => {
  it("answers with citations when sources match", async () => {
    const { deps, calls } = setup();
    await ingest(deps, { packageName: "libx", version: "5.0.0", source: "CHANGELOG.md", text: NOTES });
    const res = await ask(deps, { question: "Was the legacy callback API removed?", packageName: "libx" });
    expect(res.sources.length).toBeGreaterThan(0);
    expect(res.sources[0].n).toBe(1);
    expect(calls[0].user).toContain("[1]");
  });

  it("refuses without calling the LLM when nothing is relevant", async () => {
    const { deps, calls } = setup();
    await ingest(deps, { packageName: "libx", version: "5.0.0", source: "CHANGELOG.md", text: NOTES });
    const res = await ask(deps, { question: "How do I bake sourdough bread?" });
    expect(res.sources).toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it("filters by package", async () => {
    const { deps } = setup();
    await ingest(deps, { packageName: "libx", version: "5.0.0", source: "a", text: NOTES });
    const res = await ask(deps, { question: "Was the legacy callback API removed?", packageName: "liby" });
    expect(res.sources).toEqual([]);
  });
});

describe("HTTP API", () => {
  it("rejects invalid ingest bodies with 400", async () => {
    const app = createApp(setup().deps);
    const res = await request(app).post("/api/ingest").send({ packageName: "libx" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");
  });

  it("ingests then answers end to end", async () => {
    const app = createApp(setup().deps);
    const ing = await request(app)
      .post("/api/ingest")
      .send({ packageName: "libx", version: "5.0.0", source: "CHANGELOG.md", text: NOTES });
    expect(ing.status).toBe(201);
    const res = await request(app)
      .post("/api/ask")
      .send({ question: "Was the legacy callback API removed?", packageName: "libx" });
    expect(res.status).toBe(200);
    expect(res.body.answer).toContain("[1]");
    expect(res.body.sources[0].packageName).toBe("libx");
  });

  it("rejects too-short questions", async () => {
    const res = await request(createApp(setup().deps)).post("/api/ask").send({ question: "hi" });
    expect(res.status).toBe(400);
  });
});
