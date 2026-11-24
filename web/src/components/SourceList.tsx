import type { Source } from "../types";

export default function SourceList({ sources }: { sources: Source[] }) {
  return (
    <ol className="sources">
      {sources.map((s) => (
        <li key={s.n}>
          <span className="badge">[{s.n}]</span>{" "}
          <strong>{s.packageName}</strong>@{s.version}
          <span className="muted"> · {s.source} · similarity {s.score.toFixed(2)}</span>
        </li>
      ))}
    </ol>
  );
}
