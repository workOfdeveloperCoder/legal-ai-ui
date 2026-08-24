/**
 * Join streamed LLM chunks without gluing words together
 * and without inserting extra spaces the model already sent.
 */
export function appendStreamChunk(existing, next) {
  const left = String(existing || "");
  const right = String(next || "");
  if (!right) return left;
  if (!left) return right;

  const leftEnd = left.slice(-1);
  const rightStart = right[0];
  const leftIsWord = /[A-Za-z0-9)\]"'%]/.test(leftEnd);
  const rightIsWord = /[A-Za-z0-9(\["']/.test(rightStart);
  if (leftIsWord && rightIsWord) {
    return `${left} ${right}`;
  }
  return left + right;
}

/** Markdown hard line-breaks so single newlines stay visible. */
export function withHardBreaks(text) {
  return String(text || "").replace(/\r\n/g, "\n").replace(/\n/g, "  \n");
}
