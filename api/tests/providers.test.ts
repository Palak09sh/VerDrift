import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { OpenAICompatibleEmbedder } from "../src/embed.js";
import { OpenAICompatibleLLM } from "../src/llm.js";

let server: http.Server;
let base: string;
const seen: { url?: string; auth?: string; body?: any }[] = [];

beforeAll(async () => {
  server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const body = JSON.parse(raw);
      seen.push({ url: req.url, auth: req.headers.authorization, body });
      res.setHeader("content-type", "application/json");
      if (req.url === "/v1/embeddings") {
        // return out of order to prove we sort by index
        res.end(JSON.stringify({ data: [
          { index: 1, embedding: [0, 1] },
          { index: 0, embedding: [1, 0] },
        ] }));
      } else if (req.url === "/v1/chat/completions") {
        res.end(JSON.stringify({ choices: [{ message: { content: "hello [1]" } }] }));
      } else {
        res.statusCode = 404;
        res.end("nope");
      }
    });
  });
  await new Promise<void>((r) => server.listen(0, r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`;
});
afterAll(() => server.close());

describe("OpenAI-compatible providers", () => {
  it("embedder sorts by index and tolerates a trailing slash", async () => {
    const e = new OpenAICompatibleEmbedder({ url: `${base}/`, apiKey: "k", model: "m" });
    expect(await e.embed(["a", "b"])).toEqual([[1, 0], [0, 1]]);
    const last = seen.at(-1)!;
    expect(last.url).toBe("/v1/embeddings");
    expect(last.auth).toBe("Bearer k");
    expect(last.body.input).toEqual(["a", "b"]);
  });

  it("LLM sends system+user messages and parses the reply", async () => {
    const l = new OpenAICompatibleLLM({ url: base, apiKey: "k", model: "m" });
    expect(await l.answer("sys", "usr")).toBe("hello [1]");
    expect(seen.at(-1)!.body.messages).toEqual([
      { role: "system", content: "sys" },
      { role: "user", content: "usr" },
    ]);
  });

  it("throws a useful error on HTTP failure", async () => {
    const l = new OpenAICompatibleLLM({ url: base.replace("/v1", "/bad"), apiKey: "k", model: "m" });
    await expect(l.answer("s", "u")).rejects.toThrow(/LLM API 404/);
  });
});
