/**
 * Fill horizontal space by joining OCR/hard-wrapped *body* lines only.
 *
 * Preserves:
 * - ALL-CAPS headings and bylines on their own lines
 * - single newlines between non-joined lines (heading stacks)
 * - blank lines from the source (paragraph spacing)
 */

function lettersOnly(line) {
  return line.replace(/[^A-Za-z]/g, "");
}

function isAllCapsHeading(line) {
  const letters = lettersOnly(line);
  return (
    letters.length >= 3 &&
    letters === letters.toUpperCase() &&
    line.length <= 90
  );
}

function startsWithLowercaseWord(line) {
  const match = line.match(/[A-Za-z]/);
  return Boolean(match && match[0] === match[0].toLowerCase());
}

function endsSentence(line) {
  return /[.!?]["')\]]*$/.test(line);
}

function isByline(line) {
  return /^(By|BY|Author|AUTHOR)\b/.test(line);
}

function shouldJoin(current, next) {
  if (!current || !next) return false;
  if (isAllCapsHeading(current) || isAllCapsHeading(next)) return false;
  if (isByline(current)) return false;
  // Hard-wrap continuation: next line starts mid-sentence.
  if (startsWithLowercaseWord(next)) return true;
  // Long line cut mid-sentence without terminal punctuation.
  if (current.length >= 55 && !endsSentence(current) && !isByline(next)) {
    return true;
  }
  return false;
}

export function reflowDocumentText(text) {
  if (!text) return "";
  const lines = String(text)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n");

  const outputLines = [];
  let current = "";

  const pushCurrent = () => {
    if (!current) return;
    outputLines.push(current.replace(/\s+/g, " ").trim());
    current = "";
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      pushCurrent();
      // Keep one blank line for source paragraph spacing.
      if (outputLines.length > 0 && outputLines[outputLines.length - 1] !== "") {
        outputLines.push("");
      }
      continue;
    }

    if (!current) {
      current = line;
      continue;
    }

    if (shouldJoin(current, line)) {
      current = `${current} ${line}`;
    } else {
      pushCurrent();
      current = line;
    }
  }
  pushCurrent();

  // Single \n between heading lines; blank entries become preserved empty lines.
  return outputLines.join("\n");
}
