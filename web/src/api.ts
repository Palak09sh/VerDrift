import type { AskResponse, IngestInput } from "./types";

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

async function post<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError("Can't reach the API. Is the server running on port 3000?");
  }

  if (res.status === 400) {
    const json = (await res.json().catch(() => null)) as {
      issues?: { message: string; path: (string | number)[] }[];
    } | null;
    const detail = json?.issues?.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new ApiError(detail || "Invalid request.", 400);
  }
  if (!res.ok) throw new ApiError("Server error. Please try again.", res.status);
  return (await res.json()) as T;
}

export const ask = (
  body: { question: string; packageName?: string },
  signal?: AbortSignal
) => post<AskResponse>("/api/ask", body, signal);

export const ingest = (body: IngestInput) => post<{ chunks: number }>("/api/ingest", body);
