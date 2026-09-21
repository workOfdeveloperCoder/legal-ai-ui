import { describe, expect, it } from "vitest";
import { describeVoiceError } from "./voiceService";

describe("describeVoiceError", () => {
  it("explains a missing mediaDevices TypeError", () => {
    const error = new TypeError(
      "undefined is not an object (evaluating 'navigator.mediaDevices.getUserMedia')"
    );
    expect(describeVoiceError(error)).toMatch(/cannot access the microphone/i);
  });

  it("explains an insecure-context mic error", () => {
    const error = new Error("Microphone requires a secure context");
    error.name = "SecurityError";
    error.code = "insecure-context";
    expect(describeVoiceError(error)).toMatch(/needs HTTPS/i);
  });

  it("explains an unsupported mic error", () => {
    const error = new Error("Microphone API is not available");
    error.name = "NotSupportedError";
    error.code = "mic-unsupported";
    expect(describeVoiceError(error)).toMatch(/cannot access the microphone/i);
  });

  it("explains permission denial", () => {
    const error = new Error("denied");
    error.name = "NotAllowedError";
    expect(describeVoiceError(error)).toMatch(/allow microphone/i);
  });
});
