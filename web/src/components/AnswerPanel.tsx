import type { AskResponse } from "../types";
import SourceList from "./SourceList";

export type RequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: AskResponse }
  | { status: "error"; message: string };

export default function AnswerPanel({ state }: { state: RequestState }) {
  if (state.status === "idle") {
    return <p className="muted center">Ask a question about ingested release notes.</p>;
  }
  if (state.status === "loading") {
    return <div className="card">Searching release notes…</div>;
  }
  if (state.status === "error") {
    return (
      <div className="card error" role="alert">
        {state.message}
      </div>
    );
  }

  const { answer, sources } = state.data;
  // A refusal is a *successful* response with no sources: show it as a notice, not an error.
  if (sources.length === 0) {
    return <div className="card notice">{answer}</div>;
  }
  return (
    <div className="card stack">
      <p className="answer">{answer}</p>
      <h2>Sources</h2>
      <SourceList sources={sources} />
    </div>
  );
}
