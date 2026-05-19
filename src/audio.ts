/**
 * Minimal Web Audio synth. Provides short tones for game events.
 *
 * If the Web Audio API is unavailable (or the user has not yet interacted),
 * methods are no-ops. All audio is synthesised — no audio files are
 * bundled or fetched.
 */

type AC = AudioContext | null;

export class SoundEngine {
  private ctx: AC = null;
  private enabled = true;

  enable(value: boolean): void {
    this.enabled = value;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** Lazily create the AudioContext after a user gesture. */
  resume(): void {
    if (!this.enabled) return;
    if (!this.ctx) {
      try {
        const Ctor =
          (globalThis as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
          (globalThis as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  private tone(freq: number, durMs: number, type: OscillatorType = 'square', gain = 0.04): void {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + durMs / 1000);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + durMs / 1000);
  }

  move(): void {
    this.tone(220, 30, 'square', 0.02);
  }
  rotate(): void {
    this.tone(330, 40, 'triangle', 0.025);
  }
  drop(): void {
    this.tone(140, 70, 'sawtooth', 0.035);
  }
  lock(): void {
    this.tone(180, 50, 'square', 0.03);
  }
  clear(lines: number): void {
    const base = 440 + lines * 80;
    this.tone(base, 90, 'sine', 0.05);
    setTimeout(() => this.tone(base * 1.25, 90, 'sine', 0.05), 80);
  }
  hold(): void {
    this.tone(260, 50, 'triangle', 0.03);
  }
  gameOver(): void {
    this.tone(160, 250, 'sawtooth', 0.06);
    setTimeout(() => this.tone(110, 350, 'sawtooth', 0.06), 220);
  }
}
