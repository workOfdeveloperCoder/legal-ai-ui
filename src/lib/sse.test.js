import { describe, expect, it } from "vitest";

import { consumeSseBuffer, parseSseBlock } from "./sse";

describe("parseSseBlock", () => {
  it("reads named events and JSON data", () => {
    const parsed = parseSseBlock(
      'event: token\ndata: {"event":"token","text":"Hello"}'
    );
    expect(parsed.event).toBe("token");
    expect(parsed.data.text).toBe("Hello");
  });

  it("ignores keepalive comments", () => {
    expect(parseSseBlock(": keepalive")).toBeNull();
  });
});

describe("consumeSseBuffer", () => {
  it("emits thinking then token frames in order", () => {
    const events = [];
    consumeSseBuffer(
      'event: thinking\ndata: {"event":"thinking","text":"reason"}\n\nevent: token\ndata: {"event":"token","text":"§ 54-c"}\n\n',
      (item) => events.push(item)
    );
    expect(events.map((item) => item.event)).toEqual(["thinking", "token"]);
    expect(events[0].data.text).toBe("reason");
    expect(events[1].data.text).toBe("§ 54-c");
  });

  it("emits complete frames and keeps a partial tail", () => {
    const events = [];
    const rest = consumeSseBuffer(
      'event: thinking\ndata: {"event":"thinking","text":"…"}\n\nevent: token\ndata: {"text":"Sec"}',
      (item) => events.push(item)
    );
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("thinking");
    expect(rest.startsWith("event: token")).toBe(true);
  });
});
