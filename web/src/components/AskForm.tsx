import { useState, type FormEvent } from "react";

interface Props {
  loading: boolean;
  onAsk: (question: string, packageName?: string) => void;
}

export default function AskForm({ loading, onAsk }: Props) {
  const [question, setQuestion] = useState("");
  const [packageName, setPackageName] = useState("");
  const tooShort = question.trim().length < 3;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (tooShort || loading) return;
    onAsk(question.trim(), packageName.trim() || undefined);
  }

  return (
    <form onSubmit={submit} className="card stack">
      <label className="field">
        <span>Package (optional)</span>
        <input
          value={packageName}
          onChange={(e) => setPackageName(e.target.value)}
          placeholder="e.g. react"
          disabled={loading}
        />
      </label>
      <label className="field">
        <span>Your question</span>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit(e);
          }}
          placeholder="Will upgrading to v19 break my code?"
          rows={3}
          disabled={loading}
        />
      </label>
      <div className="row">
        <button type="submit" disabled={tooShort || loading}>
          {loading ? "Searching…" : "Ask"}
        </button>
        <span className="hint">Ctrl+Enter to submit</span>
      </div>
    </form>
  );
}
