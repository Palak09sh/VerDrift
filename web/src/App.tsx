import { useRef, useState } from "react";
import { ApiError, ask } from "./api";
import AnswerPanel, { type RequestState } from "./components/AnswerPanel";
import AskForm from "./components/AskForm";
import IngestForm from "./components/IngestForm";

export default function App() {
  const [state, setState] = useState<RequestState>({ status: "idle" });
  const controller = useRef<AbortController | null>(null);

  async function handleAsk(question: string, packageName?: string) {
    // cancel any in-flight request so a slow old answer can't overwrite a newer one
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    setState({ status: "loading" });
    try {
      const data = await ask({ question, packageName }, ctrl.signal);
      setState({ status: "success", data });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setState({
        status: "error",
        message: err instanceof ApiError ? err.message : "Something went wrong.",
      });
    }
  }

  return (
    <main className="container">
      <header>
        <h1>VerDrift</h1>
        <p className="muted">Will upgrading break my code? Answers grounded in release notes, with sources.</p>
      </header>
      <AskForm loading={state.status === "loading"} onAsk={handleAsk} />
      <AnswerPanel state={state} />
      <IngestForm />
    </main>
  );
}
