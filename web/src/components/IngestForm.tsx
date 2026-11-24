import { useState, type FormEvent } from "react";
import { ApiError, ingest } from "../api";

export default function IngestForm() {
  const [packageName, setPackageName] = useState("");
  const [version, setVersion] = useState("");
  const [source, setSource] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const { chunks } = await ingest({ packageName, version, source, text });
      setMsg({ ok: true, text: `Ingested ${chunks} chunks for ${packageName}@${version}.` });
      setText("");
    } catch (err) {
      setMsg({ ok: false, text: err instanceof ApiError ? err.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  const ready = packageName && version && source && text.trim();

  return (
    <details className="card">
      <summary>Add release notes</summary>
      <form onSubmit={submit} className="stack" style={{ marginTop: 12 }}>
        <div className="row">
          <input placeholder="package" value={packageName} onChange={(e) => setPackageName(e.target.value)} />
          <input placeholder="version" value={version} onChange={(e) => setVersion(e.target.value)} />
          <input placeholder="source (e.g. GitHub release URL)" value={source} onChange={(e) => setSource(e.target.value)} />
        </div>
        <textarea rows={6} placeholder="Paste release notes here" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="row">
          <button type="submit" disabled={!ready || busy}>{busy ? "Ingesting…" : "Ingest"}</button>
          {msg && <span className={msg.ok ? "ok" : "errtext"}>{msg.text}</span>}
        </div>
      </form>
    </details>
  );
}
