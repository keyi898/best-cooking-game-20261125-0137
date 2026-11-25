// Ember & Thyme — all sound is synthesized with WebAudio: no audio files,
// no network. A tiny music-box loop plays under the shift; every action has a
// short blip. Audio starts on the first user gesture, as browsers require.

const NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5 pentatonic-ish

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.musicTimer = null;
    this.step = 0;
    this.muted = false;
    this.musicOn = false;
  }

  ensure() {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? window.webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // One short oscillator blip: (frequency, seconds, wave, loudness, slide-to).
  blip(freq, dur, type = 'sine', gain = 0.12, slideTo = 0) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
    amp.gain.setValueAtTime(gain, now);
    amp.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(amp).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  chop() {
    this.blip(180, 0.07, 'square', 0.08, 90);
    this.blip(1200, 0.03, 'triangle', 0.05);
  }

  pickup() {
    this.blip(440, 0.08, 'sine', 0.1, 660);
  }

  place() {
    this.blip(330, 0.08, 'triangle', 0.1, 220);
  }

  ding() {
    this.blip(880, 0.25, 'sine', 0.12);
    this.blip(1318, 0.3, 'sine', 0.08);
  }

  coin() {
    this.blip(987, 0.09, 'sine', 0.12);
    setTimeout(() => this.blip(1318, 0.14, 'sine', 0.12), 70);
  }

  fail() {
    this.blip(220, 0.3, 'sawtooth', 0.07, 110);
  }

  burn() {
    this.blip(160, 0.4, 'sawtooth', 0.09, 60);
  }

  tick() {
    this.blip(1200, 0.04, 'square', 0.04);
  }

  // A gentle music-box loop: one note every half second, cycling a small
  // phrase, quiet enough to sit under the action.
  startMusic() {
    if (!this.ctx || this.musicOn) return;
    this.musicOn = true;
    const phrase = [0, 2, 4, 2, 5, 4, 2, 1, 0, 2, 4, 5, 4, 2, 0, -1];
    this.musicTimer = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const idx = phrase[this.step % phrase.length];
      const note = idx < 0 ? NOTES[0] / 2 : NOTES[idx % NOTES.length];
      this.blip(note, 0.5, 'sine', 0.045);
      if (this.step % 8 === 4) this.blip(note / 2, 0.6, 'triangle', 0.03);
      this.step += 1;
    }, 480);
  }

  stopMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
    this.musicOn = false;
  }
}
