/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */

export type SfxName = 'land' | 'tumble' | 'win';

export type SfxContext = {
  currentTime: number;
  destination: unknown;
  state?: AudioContext['state'];
  resume?: () => Promise<void>;
  createOscillator(): {
    type: string;
    frequency: { value: number };
    connect(node: unknown): unknown;
    start(when?: number): void;
    stop(when?: number): void;
  };
  createGain(): {
    gain: {
      setValueAtTime(value: number, time: number): unknown;
      exponentialRampToValueAtTime(value: number, time: number): unknown;
    };
    connect(node: unknown): unknown;
  };
};

export type SfxPlayer = {
  muted: boolean;
  play(name: SfxName): void;
  resume(): void;
};

const SFX: Record<SfxName, { frequency: number; duration: number }> = {
  land: { frequency: 520, duration: 0.08 },
  tumble: { frequency: 180, duration: 0.2 },
  win: { frequency: 660, duration: 0.18 },
};

export function createSfx(ctx?: SfxContext): SfxPlayer {
  let audioCtx: SfxContext | null = ctx ?? null;

  function ensureCtx(): SfxContext | null {
    if (audioCtx) return audioCtx;
    try {
      audioCtx = new AudioContext();
    } catch {
      audioCtx = null;
    }
    return audioCtx;
  }

  const player: SfxPlayer = {
    muted: false,
    resume() {
      const context = ensureCtx();
      if (!context?.resume) return;
      void context.resume();
    },
    play(name: SfxName) {
      if (player.muted) return;
      const context = ensureCtx();
      if (!context) return;
      if (context.state && context.state !== 'running') return;

      const { frequency, duration } = SFX[name];
      const osc = context.createOscillator();
      const gain = context.createGain();

      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.15, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime + duration,
      );

      osc.connect(gain);
      gain.connect(context.destination);

      osc.start(context.currentTime);
      osc.stop(context.currentTime + duration);
    },
  };

  return player;
};
