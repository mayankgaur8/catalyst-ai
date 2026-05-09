// Web Audio API sound engine — zero external dependencies

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const Ctx =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gainLevel = 0.25,
  delayMs = 0
) {
  const schedule = () => {
    const ctx = getCtx();
    if (!ctx) return;
    try {
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gainNode.gain.setValueAtTime(gainLevel, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Silently fail — audio is non-critical
    }
  };

  if (delayMs > 0) setTimeout(schedule, delayMs);
  else schedule();
}

export const sounds = {
  correct: () => {
    playTone(523.25, 0.12, "sine", 0.25, 0);
    playTone(659.25, 0.12, "sine", 0.25, 90);
    playTone(783.99, 0.22, "sine", 0.25, 180);
  },

  wrong: () => {
    playTone(220, 0.08, "sawtooth", 0.12, 0);
    playTone(180, 0.25, "sawtooth", 0.08, 60);
  },

  xp: () => {
    playTone(440, 0.06, "sine", 0.18, 0);
    playTone(554.37, 0.1, "sine", 0.18, 55);
  },

  levelup: () => {
    [261.63, 329.63, 392, 523.25, 659.25].forEach((f, i) =>
      playTone(f, 0.22, "sine", 0.22, i * 75)
    );
  },

  streak: () => {
    [392, 440, 523.25, 659.25, 783.99].forEach((f, i) =>
      playTone(f, 0.14, "triangle", 0.22, i * 55)
    );
  },

  click: () => playTone(700, 0.04, "sine", 0.07),

  achievement: () => {
    [261.63, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      playTone(f, 0.2, "sine", 0.18, i * 65)
    );
  },

  notification: () => {
    playTone(660, 0.08, "sine", 0.14, 0);
    playTone(880, 0.12, "sine", 0.14, 80);
  },
} as const;

export type SoundKey = keyof typeof sounds;

export function playSound(key: SoundKey, enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  try {
    sounds[key]();
  } catch {
    // Non-critical
  }
}
