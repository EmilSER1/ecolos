export async function readFileSmart(file: File): Promise<string> {
  const ab = await file.arrayBuffer();
  let txt = new TextDecoder("utf-8", { fatal: false }).decode(ab);

  // Check for encoding issues
  if ((txt.match(/\uFFFD/g) || []).length > 5) {
    try {
      txt = new TextDecoder("windows-1251").decode(ab);
    } catch (e) {
      // Keep UTF-8 version
    }
  }

  // Remove BOM
  if (txt.charCodeAt(0) === 0xfeff) txt = txt.slice(1);

  return txt;
}

function detectSep(header: string): string {
  const seps = [";", "\t", ",", "|"];
  let best = ";";
  let score = -1;

  for (const s of seps) {
    const cnt = (header.match(new RegExp("\\" + s, "g")) || []).length;
    if (cnt > score) {
      score = cnt;
      best = s;
    }
  }

  return best;
}

function splitQuoted(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        q = !q;
      }
      continue;
    }

    if (ch === sep && !q) {
      out.push(cur);
      cur = "";
      continue;
    }

    cur += ch;
  }

  out.push(cur);
  return out;
}

export function parseCSVText(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (!lines.length) return [];

  const sep = detectSep(lines[0]);
  const headers = splitQuoted(lines[0], sep).map((s) =>
    s.trim().replace(/^"|"$/g, "")
  );

  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = splitQuoted(lines[i], sep).map((s) =>
      s.trim().replace(/^"|"$/g, "")
    );
    const r: Record<string, string> = {};

    headers.forEach((h, idx) => {
      r[h] = (parts[idx] ?? "").trim();
    });

    // Skip empty rows
    if (Object.values(r).every((v) => !String(v).trim())) continue;

    rows.push(r);
  }

  return rows;
}
