import { ApiError, apiRequest } from "../lib/apiClient";

const SPEAK_MAX_CHARS = 8000;
let currentAudio = null;

export function stripForSpeech(text) {
  if (!text) return "";
  return String(text)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[\d+\]/g, " ")
    .replace(/[*_#>]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SPEAK_MAX_CHARS);
}

export function describeVoiceError(error) {
  if (!error) return "Voice request failed.";
  const name = error.name || "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Allow microphone access to use voice.";
  }
  if (name === "NotFoundError") {
    return "No microphone was found.";
  }
  if (name === "NotReadableError" || name === "AbortError") {
    if (name === "AbortError") return "Voice was cancelled.";
    return "Could not access the microphone.";
  }

  const status = error.status;
  const message = String(error.message || error.detail || "");
  if (status === 503 || /not available|install local/i.test(message)) {
    return message || "Voice is not available on this server.";
  }
  if (status === 413 || /too large|45 second/i.test(message)) {
    return "Keep recordings under 45 seconds.";
  }
  if (status === 400 && /wav|empty/i.test(message)) {
    return message || "Could not read that recording.";
  }
  return message || "Voice request failed.";
}

export async function getVoiceStatus() {
  return apiRequest("/voice/status");
}

export async function transcribeWav(blob) {
  const formData = new FormData();
  formData.append("file", blob, "recording.wav");
  return apiRequest("/voice/transcribe", {
    method: "POST",
    body: formData,
  });
}

export function stopSpeech() {
  if (!currentAudio) return;
  currentAudio.pause();
  currentAudio.src = "";
  currentAudio = null;
}

export async function playSpeech(text, { signal } = {}) {
  const spoken = stripForSpeech(text);
  if (!spoken) return;

  const response = await apiRequest("/voice/speak", {
    method: "POST",
    body: JSON.stringify({ text: spoken }),
    raw: true,
    signal,
  });

  if (!response.ok) {
    let detail;
    try {
      const body = await response.json();
      detail = body?.detail ?? body;
    } catch {
      detail = response.statusText;
    }
    const message =
      typeof detail === "string" ? detail : "Could not speak the answer.";
    throw new ApiError(message, { status: response.status, detail });
  }

  const blob = await response.blob();
  stopSpeech();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  currentAudio = audio;

  await new Promise((resolve, reject) => {
    const cleanup = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
    };
    audio.onended = () => {
      cleanup();
      resolve();
    };
    audio.onerror = () => {
      cleanup();
      reject(new Error("Audio playback failed."));
    };
    if (signal) {
      signal.addEventListener(
        "abort",
        () => {
          stopSpeech();
          cleanup();
          reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
        },
        { once: true }
      );
    }
    audio.play().catch(reject);
  });
}
