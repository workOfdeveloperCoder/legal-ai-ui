/**
 * Parse Server-Sent Events from a fetch() ReadableStream.
 */

export function parseSseBlock(block) {
  if (!block || !block.trim()) return null;
  let event = "message";
  const dataLines = [];
  for (const rawLine of block.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (!line || line.startsWith(":")) continue;
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).replace(/^ /, ""));
    }
  }
  if (!dataLines.length) return null;
  let data = dataLines.join("\n");
  try {
    data = JSON.parse(data);
  } catch {
    // keep raw string
  }
  if (data && typeof data === "object" && data.event) {
    event = data.event;
  }
  return { event, data };
}

export function consumeSseBuffer(buffer, onEvent) {
  let remainder = buffer.replace(/\r\n/g, "\n");
  while (true) {
    const split = remainder.indexOf("\n\n");
    if (split < 0) return remainder;
    const parsed = parseSseBlock(remainder.slice(0, split));
    remainder = remainder.slice(split + 2);
    if (parsed) onEvent(parsed);
  }
}

export async function readSseStream(response, onEvent) {
  if (!response.body) {
    throw new Error("Streaming is not supported in this browser.");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    buffer = consumeSseBuffer(buffer, onEvent);
  }
  buffer += decoder.decode();
  if (buffer.trim()) {
    consumeSseBuffer(`${buffer}\n\n`, onEvent);
  }
}
