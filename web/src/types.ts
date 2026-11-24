export interface Source {
  n: number;
  packageName: string;
  version: string;
  source: string;
  score: number;
}

export interface AskResponse {
  answer: string;
  sources: Source[];
}

export interface IngestInput {
  packageName: string;
  version: string;
  source: string;
  text: string;
}
