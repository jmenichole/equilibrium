/**
 * Copyright (c) 2026 jmenichole. All rights reserved.
 */

export type SfxName = 'land' | 'tumble' | 'win';

export type SfxPlayer = {
  muted: boolean;
  play(name: SfxName): void;
};

type SfxContext = Pick<
  AudioContext,
  'createOscillator' | 'createGain' | 'destination' | 'currentTime'
>;

const SFX: Record<SfxName, { frequency: number; duration: number }> = {
  land: { frequency: 520, duration: 0.08 },
  tumble: { frequency: 180, duration: 0.2 },
  win: { frequency: 660, duration: 0.18 },
};

export function createSfx(ctx?: SfxContext): SfxPlayer {
  let audioCtx: SfxContext | null = ctx ?? null;

  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      audioCtx = null;
    }
  }

  const player: SfxPlayer = {
    muted: false,
    play(name: SfxName) {
      if (player.muted || !audioCtx) return;

      const { frequency, duration } = SFX[name];
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + duration,
      );

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + duration);
    },
  };

  return player;
}
