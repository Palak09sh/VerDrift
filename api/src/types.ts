export interface NewChunk {
  packageName: string;
  version: string;
  source: string;
  content: string;
  embedding: number[];
}

export interface ScoredChunk {
  id: number;
  packageName: string;
  version: string;
  source: string;
  content: string;
  /** cosine similarity, higher is more similar */
  score: number;
}

export interface VectorStore {
  add(chunks: NewChunk[]): Promise<void>;
  search(
    embedding: number[],
    opts: { packageName?: string; limit: number }
  ): Promise<ScoredChunk[]>;
}

export interface Embedder {
  embed(texts: string[]): Promise<number[][]>;
}

export interface LLM {
  answer(system: string, user: string): Promise<string>;
}

export interface Deps {
  embedder: Embedder;
  store: VectorStore;
  llm: LLM;
}
