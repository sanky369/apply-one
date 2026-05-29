// Best-effort extraction of a string field from a *partial* JSON string that is
// still being streamed. Used to reveal cover-letter / cold-email prose live.
// The final, authoritative values come from JSON.parse on completion.

function decodeEscapes(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "\\" && i + 1 < s.length) {
      const n = s[i + 1];
      switch (n) {
        case "n":
          out += "\n";
          i++;
          break;
        case "t":
          out += "\t";
          i++;
          break;
        case "r":
          i++;
          break;
        case '"':
          out += '"';
          i++;
          break;
        case "\\":
          out += "\\";
          i++;
          break;
        case "/":
          out += "/";
          i++;
          break;
        case "u": {
          const hex = s.slice(i + 2, i + 6);
          if (/^[0-9a-fA-F]{4}$/.test(hex)) {
            out += String.fromCharCode(parseInt(hex, 16));
            i += 5;
          }
          break;
        }
        default:
          break; // dangling backslash at the stream edge — skip it
      }
    } else {
      out += c;
    }
  }
  return out;
}

/**
 * Find the string value following the first occurrence of `"key"` in `src`.
 * Tolerates an unterminated string (returns what's accumulated so far).
 */
export function extractStreamingString(src: string, key: string): string {
  const keyToken = `"${key}"`;
  const ki = src.indexOf(keyToken);
  if (ki === -1) return "";
  let i = ki + keyToken.length;
  // skip whitespace and the colon
  while (i < src.length && /[\s:]/.test(src[i])) i++;
  if (src[i] !== '"') return "";
  i++; // past opening quote
  let raw = "";
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") {
      raw += c + (src[i + 1] ?? "");
      i += 2;
      continue;
    }
    if (c === '"') break; // closing quote reached
    raw += c;
    i++;
  }
  return decodeEscapes(raw);
}
