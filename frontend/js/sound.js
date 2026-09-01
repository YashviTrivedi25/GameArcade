// ==========================================================================
// PAPER ARCADE - PROCEDURAL WEB AUDIO SOUND FX
// Zero external audio files required, runs 100% locally with master volume control
// ==========================================================================

class SoundFX {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    
    // Load volume and muted state from storage
    const savedVol = localStorage.getItem('paper_arcade_volume');
    this.volume = savedVol !== null ? parseFloat(savedVol) : 0.8;
    this.muted = localStorage.getItem('paper_arcade_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.applyVolumeToGain();
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  applyVolumeToGain() {
    if (this.ctx && this.masterGain) {
      const targetGain = this.muted ? 0 : Math.max(0, Math.min(1, this.volume));
      this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
  }

  getVolume() {
    return this.volume;
  }

  getVolumePercent() {
    return Math.round(this.volume * 100);
  }

  setVolume(fraction) {
    this.volume = Math.max(0, Math.min(1, fraction));
    localStorage.setItem('paper_arcade_volume', this.volume.toString());
    
    // If volume is raised above 0 while muted, unmute automatically
    if (this.volume > 0.01 && this.muted) {
      this.muted = false;
      localStorage.setItem('paper_arcade_muted', 'false');
    }
    
    this.init();
    this.applyVolumeToGain();
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('paper_arcade_muted', this.muted.toString());
    this.init();
    this.applyVolumeToGain();
    return this.muted;
  }

  setMute(isMuted) {
    this.muted = !!isMuted;
    localStorage.setItem('paper_arcade_muted', this.muted.toString());
    this.init();
    this.applyVolumeToGain();
    return this.muted;
  }

  isMuted() {
    return this.muted || this.volume <= 0.01;
  }

  playClick() {
    if (this.isMuted()) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  playMark() {
    if (this.isMuted()) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    // Pencil mark scratch sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(260, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playCard() {
    if (this.isMuted()) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.09);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  playWin() {
    if (this.isMuted()) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.08 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.16);
    });
  }

  playLoss() {
    if (this.isMuted()) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const notes = [440, 392, 349.23, 293.66]; // Downward slide

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);

      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.1 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.18);
    });
  }

  playDraw() {
    if (this.isMuted()) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.linearRampToValueAtTime(300, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  playTestSound() {
    if (this.isMuted()) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }
}

export const sound = new SoundFX();

