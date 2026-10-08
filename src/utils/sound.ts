// Efeitos sonoros sintetizados via Web Audio API para impactos, coleta, chaves e morte súbita

class SoundController {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playStep() {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(75, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  playPowerUp(isMult = false) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = isMult ? [330, 440, 659, 880] : [392, 523.25];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isMult ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.055);
      gain.gain.setValueAtTime(0.11, now + i * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.16);
    });
  }

  playSlay() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.12);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playKeyUnlock() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [587.33, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.12, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.18);
    });
  }

  playGameOver() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [240, 190, 130].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0.16, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.25);
    });
  }

  playItemReveal(
    rarity:
      | 'COMMON'
      | 'UNCOMMON'
      | 'RARE'
      | 'EPIC'
      | 'LEGENDARY'
      | 'MYTHIC'
      | 'CELESTIAL'
  ) {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const sequences: Record<
      string,
      { notes: number[]; wave: OscillatorType; step: number; dur: number; vol: number }
    > = {
      COMMON: {
        notes: [392, 523.25],
        wave: 'sine',
        step: 0.06,
        dur: 0.15,
        vol: 0.1,
      },
      UNCOMMON: {
        notes: [392, 493.88, 587.33],
        wave: 'triangle',
        step: 0.06,
        dur: 0.18,
        vol: 0.12,
      },
      RARE: {
        notes: [440, 554.37, 659.25, 880],
        wave: 'triangle',
        step: 0.065,
        dur: 0.22,
        vol: 0.13,
      },
      EPIC: {
        notes: [392, 493.88, 587.33, 783.99, 987.77],
        wave: 'sawtooth',
        step: 0.065,
        dur: 0.26,
        vol: 0.13,
      },
      LEGENDARY: {
        notes: [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5],
        wave: 'sawtooth',
        step: 0.06,
        dur: 0.34,
        vol: 0.15,
      },
      MYTHIC: {
        notes: [220, 277.18, 329.63, 440, 554.37, 659.25, 880, 1108.73],
        wave: 'sawtooth',
        step: 0.055,
        dur: 0.38,
        vol: 0.16,
      },
      CELESTIAL: {
        notes: [261.63, 329.63, 392, 493.88, 587.33, 783.99, 987.77, 1174.66, 1567.98],
        wave: 'triangle',
        step: 0.055,
        dur: 0.45,
        vol: 0.17,
      },
    };

    const cfg = sequences[rarity] || sequences.COMMON;

    // Impact sub-bass para Épico ou superior
    if (
      rarity === 'EPIC' ||
      rarity === 'LEGENDARY' ||
      rarity === 'MYTHIC' ||
      rarity === 'CELESTIAL'
    ) {
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(140, now);
      sub.frequency.exponentialRampToValueAtTime(42, now + 0.35);
      subGain.gain.setValueAtTime(0.22, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      sub.connect(subGain);
      subGain.connect(ctx.destination);
      sub.start(now);
      sub.stop(now + 0.38);
    }

    cfg.notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = cfg.wave;
      const startTime = now + i * cfg.step;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(cfg.vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + cfg.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + cfg.dur);
    });
  }
}

export const soundFX = new SoundController();
