function mergeFloat32(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset, value) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let index = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(index, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    index += 2;
  }

  return buffer;
}

export const MAX_STT_SECONDS = 45;

export async function startWavRecorder({
  maxSeconds = MAX_STT_SECONDS,
  onLimit,
} = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      channelCount: 1,
    },
  });
  const ctx = new AudioContext({ sampleRate: 16000 });
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.65;
  const processor = ctx.createScriptProcessor(4096, 1, 1);
  const mute = ctx.createGain();
  mute.gain.value = 0;
  const chunks = [];
  let stopped = false;
  let limitTimer = null;

  processor.onaudioprocess = (event) => {
    if (stopped) return;
    chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
  };

  source.connect(analyser);
  source.connect(processor);
  processor.connect(mute);
  mute.connect(ctx.destination);

  function cleanup() {
    if (limitTimer) {
      clearTimeout(limitTimer);
      limitTimer = null;
    }
    processor.disconnect();
    analyser.disconnect();
    source.disconnect();
    mute.disconnect();
    stream.getTracks().forEach((track) => track.stop());
    if (ctx.state !== "closed") ctx.close();
  }

  if (maxSeconds > 0) {
    limitTimer = setTimeout(() => {
      if (!stopped) onLimit?.();
    }, maxSeconds * 1000);
  }

  return {
    analyser,
    async stop() {
      if (stopped) return null;
      stopped = true;
      const pcm = mergeFloat32(chunks);
      const wav = encodeWav(pcm, ctx.sampleRate || 16000);
      cleanup();
      return new Blob([wav], { type: "audio/wav" });
    },
    cancel() {
      if (stopped) return;
      stopped = true;
      cleanup();
    },
  };
}
