/**
 * Expand a character range so the highlight covers whole words and sentence(s).
 * Matching ignores whitespace / hyphen differences so reflowed corpus text still hits.
 */

function isWordChar(ch) {
  return Boolean(ch && /[A-Za-z0-9]/.test(ch));
}

function isWhitespace(ch) {
  return Boolean(ch && /\s/.test(ch));
}

const ABBREVIATIONS = new Set([
  "v",
  "vs",
  "mr",
  "mrs",
  "ms",
  "dr",
  "no",
  "nos",
  "art",
  "ss",
  "cl",
  "fig",
  "eg",
  "ie",
  "cf",
  "al",
  "etc",
  "approx",
]);

function isAbbreviationPeriod(text, periodIndex) {
  if (text[periodIndex] !== ".") return false;
  const before = text.slice(Math.max(0, periodIndex - 8), periodIndex);
  const word = (before.match(/[A-Za-z0-9]+$/i) || [""])[0];
  if (!word) return false;
  if (ABBREVIATIONS.has(word.toLowerCase())) return true;
  if (/^[0-9]+[A-Za-z]?$/i.test(word)) return true;
  return false;
}

function isSentenceTerminator(text, index) {
  const ch = text[index];
  if (!ch || !/[.!?]/.test(ch)) return false;
  if (ch === "." && isAbbreviationPeriod(text, index)) return false;
  return true;
}

function isParagraphBreakBefore(text, index) {
  return (
    index > 0 &&
    text[index - 1] === "\n" &&
    (index < 2 || text[index - 2] === "\n")
  );
}

export function expandToWordBounds(text, start, end) {
  if (!text || !Number.isInteger(start) || !Number.isInteger(end)) {
    return { start: 0, end: 0 };
  }
  let s = Math.max(0, Math.min(start, text.length));
  let e = Math.max(s, Math.min(end, text.length));
  while (s > 0 && isWordChar(text[s - 1])) s -= 1;
  while (e < text.length && isWordChar(text[e])) e += 1;
  return { start: s, end: e };
}

export function expandToSentenceBounds(text, start, end) {
  if (!text || !Number.isInteger(start) || !Number.isInteger(end)) {
    return { start: 0, end: 0 };
  }
  if (start < 0 || end <= start || end > text.length) {
    return { start, end };
  }

  ({ start, end } = expandToWordBounds(text, start, end));

  let s = start;
  while (s > 0) {
    if (isParagraphBreakBefore(text, s)) break;
    if (isSentenceTerminator(text, s - 1)) break;
    s -= 1;
  }
  while (
    s < start &&
    (isWhitespace(text[s]) || /['"“”‘’({\[]/.test(text[s] || ""))
  ) {
    s += 1;
  }
  while (s > 0 && isWordChar(text[s]) && isWordChar(text[s - 1])) s -= 1;

  let e = Math.max(end, s + 1);
  while (e < text.length) {
    if (text[e] === "\n" && (e + 1 >= text.length || text[e + 1] === "\n")) break;
    if (isSentenceTerminator(text, e)) {
      e += 1;
      while (e < text.length && /["”')\]]/.test(text[e])) e += 1;
      break;
    }
    e += 1;
  }
  while (e < text.length && isWordChar(text[e])) e += 1;

  return { start: s, end: e };
}

/** Collapse whitespace + normalize hyphens; map collapsed → original indexes. */
function buildNormalizedIndex(text) {
  const collapsed = [];
  const toOriginal = [];
  let i = 0;
  const src = String(text || "");

  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) {
      if (collapsed.length && collapsed[collapsed.length - 1] !== " ") {
        collapsed.push(" ");
        toOriginal.push(i);
      }
      while (i < src.length && /\s/.test(src[i])) i += 1;
      continue;
    }
    const normalized = /[‑–—]/.test(ch) ? "-" : ch;
    collapsed.push(normalized);
    toOriginal.push(i);
    i += 1;
  }

  // Trim leading/trailing collapsed spaces from map ends.
  let start = 0;
  let end = collapsed.length;
  while (start < end && collapsed[start] === " ") start += 1;
  while (end > start && collapsed[end - 1] === " ") end -= 1;

  return {
    text: collapsed.slice(start, end).join(""),
    toOriginal: toOriginal.slice(start, end),
  };
}

function normalizeNeedle(excerpt) {
  return String(excerpt || "")
    .replace(/[‑–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function isWordBoundaryAt(text, index) {
  if (index <= 0) return true;
  return !isWordChar(text[index - 1]);
}

/**
 * Locate excerpt in fullText despite newline / hyphen differences.
 * Returns original-text { start, end } or null.
 */
export function findExcerptRange(fullText, excerpt) {
  const needle = normalizeNeedle(excerpt);
  if (!fullText || needle.length < 8) return null;

  const hay = buildNormalizedIndex(fullText);
  if (!hay.text) return null;

  const tryProbes = [];
  tryProbes.push(needle.slice(0, Math.min(100, needle.length)));
  // Mid-word chunk starts: skip first token.
  const cut = needle.search(/\s/);
  if (cut > 0 && cut < needle.length - 12) {
    tryProbes.push(needle.slice(cut).trim().slice(0, 100));
  }
  // Also try a middle window for long excerpts.
  if (needle.length > 120) {
    tryProbes.push(needle.slice(40, 140));
  }

  let normStart = -1;
  let usedProbe = "";
  for (const probe of tryProbes) {
    if (probe.length < 8) continue;
    const idx = hay.text.indexOf(probe);
    if (idx < 0) continue;
    const origAt = hay.toOriginal[idx];
    if (origAt == null) continue;
    if (!isWordBoundaryAt(fullText, origAt) && probe === tryProbes[0]) {
      // Prefer later probes when first hits mid-word.
      continue;
    }
    normStart = idx;
    usedProbe = probe;
    break;
  }

  if (normStart < 0) {
    // Last resort: any probe hit, even mid-word (word-expand later).
    for (const probe of tryProbes) {
      if (probe.length < 8) continue;
      const idx = hay.text.indexOf(probe);
      if (idx >= 0) {
        normStart = idx;
        usedProbe = probe;
        break;
      }
    }
  }

  if (normStart < 0) return null;

  const origStart = hay.toOriginal[normStart];
  // Prefer ending at the excerpt's own suffix so we don't run into the next sentence.
  const suffix = needle.slice(-Math.min(48, needle.length));
  let normEnd = normStart + Math.min(usedProbe.length, needle.length) - 1;
  if (suffix.length >= 8) {
    const suffixAt = hay.text.indexOf(suffix, normStart);
    if (suffixAt >= 0) {
      normEnd = suffixAt + suffix.length - 1;
    }
  }
  normEnd = Math.min(hay.text.length - 1, Math.max(normEnd, normStart));
  const origEndExclusive = (hay.toOriginal[normEnd] ?? origStart) + 1;

  return expandToWordBounds(fullText, origStart, origEndExclusive);
}

/** Overlap-stitch multiple evidence passages into one combined excerpt. */
export function mergeEvidenceTexts(items = []) {
  const texts = items
    .map((item) => String(item?.excerpt || item?.text || "").trim())
    .filter(Boolean);
  if (!texts.length) return "";

  const unique = [];
  for (const text of texts) {
    if (!unique.some((existing) => normalizeNeedle(existing) === normalizeNeedle(text))) {
      unique.push(text);
    }
  }

  let merged = unique[0];
  for (let i = 1; i < unique.length; i += 1) {
    const next = unique[i];
    const left = normalizeNeedle(merged);
    const right = normalizeNeedle(next);
    if (left.includes(right)) continue;
    if (right.includes(left)) {
      merged = next;
      continue;
    }

    let joined = null;
    const maxCheck = Math.min(left.length, right.length, 800);
    for (let size = maxCheck; size >= 24; size -= 1) {
      if (left.slice(-size) === right.slice(0, size)) {
        // Map back roughly by appending unmatched raw tail.
        const ratio = merged.length / Math.max(left.length, 1);
        const cut = Math.round(size * (next.length / Math.max(right.length, 1)));
        joined = merged + next.slice(Math.min(cut, next.length));
        break;
      }
      const idx = left.lastIndexOf(right.slice(0, size));
      if (idx >= 0 && idx >= left.length - maxCheck) {
        const keepLeft = Math.round((idx / left.length) * merged.length);
        joined = merged.slice(0, keepLeft) + next;
        break;
      }
    }
    merged = joined || `${merged}\n\n${next}`;
  }

  return merged.trim();
}

export function buildHighlightedParts(fullText, startOffset, endOffset, excerpt) {
  if (!fullText) {
    return { before: "", highlight: "", after: "" };
  }

  let start = null;
  let end = null;

  if (
    Number.isInteger(startOffset) &&
    Number.isInteger(endOffset) &&
    startOffset >= 0 &&
    endOffset > startOffset &&
    endOffset <= fullText.length
  ) {
    ({ start, end } = expandToWordBounds(fullText, startOffset, endOffset));
  } else {
    const found = findExcerptRange(fullText, excerpt);
    if (found) {
      start = found.start;
      end = found.end;
    }
  }

  if (start == null || end == null) {
    return { before: fullText, highlight: "", after: "" };
  }

  const bounds = expandToSentenceBounds(fullText, start, end);
  return {
    before: fullText.slice(0, bounds.start),
    highlight: fullText.slice(bounds.start, bounds.end),
    after: fullText.slice(bounds.end),
  };
}

/**
 * Highlight the span covering all matching excerpts (merged passages).
 */
export function buildHighlightedPartsFromExcerpts(fullText, excerpts = []) {
  if (!fullText) {
    return { before: "", highlight: "", after: "" };
  }

  const list = (excerpts || []).map((item) =>
    typeof item === "string" ? item : item?.excerpt || item?.text || ""
  );
  let start = null;
  let end = null;

  for (const excerpt of list) {
    const found = findExcerptRange(fullText, excerpt);
    if (!found) continue;
    if (start == null || found.start < start) start = found.start;
    if (end == null || found.end > end) end = found.end;
  }

  if (start == null || end == null) {
    // Fall back to merged needle search.
    return buildHighlightedParts(
      fullText,
      null,
      null,
      mergeEvidenceTexts(list.map((excerpt) => ({ excerpt })))
    );
  }

  const startBound = expandToSentenceBounds(fullText, start, Math.min(start + 1, end));
  const endBound = expandToSentenceBounds(
    fullText,
    Math.max(end - 1, start),
    end
  );
  const from = startBound.start;
  const to = Math.max(endBound.end, end);

  return {
    before: fullText.slice(0, from),
    highlight: fullText.slice(from, to),
    after: fullText.slice(to),
  };
}
