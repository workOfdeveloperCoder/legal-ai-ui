import { afterEach, describe, expect, it, vi } from "vitest";
import { microphoneAvailability, startWavRecorder } from "./recordWav";

describe("microphoneAvailability", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is ok when getUserMedia exists", () => {
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia: vi.fn() },
    });
    expect(microphoneAvailability()).toEqual({ ok: true, reason: null });
  });

  it("reports insecure when mediaDevices is missing on HTTP", () => {
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("window", { isSecureContext: false });
    expect(microphoneAvailability()).toEqual({ ok: false, reason: "insecure" });
  });

  it("reports unsupported when mediaDevices is missing in a secure context", () => {
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("window", { isSecureContext: true });
    expect(microphoneAvailability()).toEqual({
      ok: false,
      reason: "unsupported",
    });
  });

  it("rejects startWavRecorder instead of throwing on mediaDevices", async () => {
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("window", { isSecureContext: true });
    await expect(startWavRecorder()).rejects.toMatchObject({
      name: "NotSupportedError",
      code: "mic-unsupported",
    });
  });
});
