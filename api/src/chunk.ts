/** Split text into overlapping chunks, preferring paragraph boundaries. */
export function chunkText(text: string, maxChars = 800, overlap = 100): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let cur = "";

  for (const p of paragraphs) {
    if (cur && cur.length + p.length + 2 > maxChars) {
      chunks.push(cur);
      cur = cur.slice(-overlap);
    }
    cur = cur ? `${cur}\n\n${p}` : p;
    // a single huge paragraph: hard-split it
    while (cur.length > maxChars * 2) {
      chunks.push(cur.slice(0, maxChars));
      cur = cur.slice(maxChars - overlap);
    }
  }
  if (cur.trim()) chunks.push(cur);
  return chunks;
}
