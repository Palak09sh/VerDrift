import type { LLM } from "./types.js";

const trimSlash = (u: string) => u.replace(/\/+$/, "");

export class AnthropicLLM implements LLM {
  constructor(private o: { apiKey: string; model: string }) {}

  async answer(system: string, user: string): Promise<string> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.o.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.o.model,
        max_tokens: 1000,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) throw new Error(`LLM API ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { content: { type: string; text?: string }[] };
    return json.content
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("");
  }
}

/** Any OpenAI-compatible /chat/completions endpoint (Gemini, Ollama, Groq, OpenAI...). */
export class OpenAICompatibleLLM implements LLM {
  constructor(private o: { url: string; apiKey: string; model: string }) {}

  async answer(system: string, user: string): Promise<string> {
    const res = await fetch(`${trimSlash(this.o.url)}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.o.apiKey}`,
      },
      body: JSON.stringify({
        model: this.o.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) throw new Error(`LLM API ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { choices: { message: { content: string | null } }[] };
    return json.choices[0]?.message?.content ?? "";
  }
}
