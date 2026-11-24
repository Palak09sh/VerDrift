// Usage: npm run ingest -- <packageName> <version> <path-to-release-notes.md>
import { readFileSync } from "node:fs";
import { ingest } from "../src/rag.js";
import { buildDeps } from "../src/wire.js";

const [packageName, version, file] = process.argv.slice(2);
if (!packageName || !version || !file) {
  console.error("Usage: npm run ingest -- <packageName> <version> <file>");
  process.exit(1);
}
const { deps, pool } = buildDeps();
const n = await ingest(deps, { packageName, version, source: file, text: readFileSync(file, "utf8") });
console.log(`Ingested ${n} chunks for ${packageName}@${version}`);
await pool.end();
