// ==========================================================================
// PAPER ARCADE - MAIN APP & ROUTER
// ==========================================================================

import { sound } from './sound.js';
import { api } from './api.js';
import { TicTacToeGame } from './ttt.js';
import { RpsGame } from './rps.js';
import { HangmanGame } from './hangman.js';

class PaperArcadeApp {
  constructor() {
    this.currentView = 'lobby';
    this.modalCallback = null;
  }

  init() {
    // Instantiate sub-games
    this.ttt = new TicTacToeGame(this);
    this.rps = new RpsGame(this);
    this.hangman = new HangmanGame(this);

    this.setupNavigation();
    this.setupModal();
    this.setupSoundToggle();

    // Initialize sub-games
    this.ttt.init();
    this.rps.init();
    this.hangman.init();

    // Fetch initial scores from server
    this.loadInitialScores();

    // Handle initial hash or default to lobby
    const hash = window.location.hash.replace('#', '') || 'lobby';
    this.navigate(hash);

    window.addEventListener('hashchange', () => {
      const newHash = window.location.hash.replace('#', '') || 'lobby';
      this.navigate(newHash);
    });
  }

  async loadInitialScores() {
    try {
      const res = await api.getScores();
      if (res && res.scores) {
        if (this.ttt) {
          if (res.scores.ttt) this.ttt.scores = res.scores.ttt;
          if (res.scores.ttt_pvp) this.ttt.pvpScores = res.scores.ttt_pvp;
          this.ttt.updateScorecard();
        }
        if (res.scores.rps && this.rps) {
          this.rps.updateScorecard(res.scores.rps);
          if (res.scores.rps.history) this.rps.renderHistory(res.scores.rps.history);
          this.rps.updateSeriesDisplay();
        }
        if (res.scores.hangman && this.hangman) this.hangman.updateScorecard(res.scores.hangman);
      }
    } catch (e) {
      console.warn('Could not load initial scores:', e);
    }
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll('a[data-view]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.dataset.view;
        sound.playClick();
        if (window.location.hash === `#${view}`) {
          this.navigate(view);
        } else {
          window.location.hash = view;
        }
      });
    });
  }

  navigate(viewName) {
    const views = ['lobby', 'hands', 'grid', 'words'];
    if (!views.includes(viewName)) viewName = 'lobby';
    this.currentView = viewName;

    // Always dismiss any active modal and callbacks on navigation
    this.hideModal();

    // Keep URL hash in sync
    if (window.location.hash !== `#${viewName}`) {
      window.location.hash = viewName;
    }

    // Toggle active view sections
    views.forEach(v => {
      const section = document.getElementById(`view-${v}`);
      if (section) {
        if (v === viewName) {
          section.classList.remove('hidden');
          section.classList.add('active');
        } else {
          section.classList.add('hidden');
          section.classList.remove('active');
        }
      }
    });

    // Update active navbar links
    document.querySelectorAll('nav.game-nav a').forEach(link => {
      if (link.dataset.view === viewName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Lifecycle triggers for fresh game start
    if (viewName === 'grid' && this.ttt) {
      this.ttt.onEnterView();
    } else if (viewName === 'hands' && this.rps) {
      this.rps.onEnterView();
    } else if (viewName === 'words' && this.hangman) {
      this.hangman.onEnterView();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setupModal() {
    this.modalOverlay = document.getElementById('modal-overlay');
    this.modalEmoji = document.getElementById('modal-emoji');
    this.modalTitle = document.getElementById('modal-title');
    this.modalMessage = document.getElementById('modal-message');
    this.modalActionBtn = document.getElementById('modal-action-btn');
    this.modalLobbyBtn = document.getElementById('modal-lobby-btn');

    if (this.modalActionBtn) {
      this.modalActionBtn.addEventListener('click', () => {
        sound.playClick();
        const cb = this.modalCallback;
        this.hideModal();
        if (typeof cb === 'function') {
          cb();
        }
      });
    }

    if (this.modalLobbyBtn) {
      this.modalLobbyBtn.addEventListener('click', () => {
        sound.playClick();
        this.hideModal();
        window.location.hash = 'lobby';
        this.navigate('lobby');
      });
    }
  }

  showModal({ emoji = '🎉', title = 'Round Over', message = '', actionText = 'Play Again', onAction = null }) {
    if (!this.modalOverlay) return;
    this.modalEmoji.textContent = emoji;
    this.modalTitle.textContent = title;
    this.modalMessage.textContent = message;
    this.modalActionBtn.textContent = actionText;
    this.modalCallback = onAction;

    this.modalOverlay.classList.add('active');
  }

  hideModal() {
    this.modalCallback = null;
    if (this.modalOverlay) {
      this.modalOverlay.classList.remove('active');
    }
  }

  setupSoundToggle() {
    this.soundBtn = document.getElementById('sound-toggle-btn');
    this.soundBtnIcon = document.getElementById('sound-btn-icon');
    this.soundBtnLabel = document.getElementById('sound-btn-label');
    this.soundPopover = document.getElementById('sound-popover');
    this.soundPopoverClose = document.getElementById('sound-popover-close');
    this.volumeSlider = document.getElementById('sound-volume-slider');
    this.volumeVal = document.getElementById('sound-volume-val');
    this.soundMuteBtn = document.getElementById('sound-mute-btn');
    this.soundTestBtn = document.getElementById('sound-test-btn');

    if (!this.soundBtn) return;

    this.updateSoundUI();

    // Toggle popover on sound button click
    this.soundBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.init(); // Warm up Web Audio context on user gesture
      if (this.soundPopover) {
        const isHidden = this.soundPopover.classList.toggle('hidden');
        this.soundBtn.setAttribute('aria-expanded', !isHidden);
        if (!isHidden) {
          this.updateSoundUI();
        }
      }
    });

    // Close button inside popover
    if (this.soundPopoverClose) {
      this.soundPopoverClose.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeSoundPopover();
      });
    }

    // Volume Slider input & change
    if (this.volumeSlider) {
      this.volumeSlider.addEventListener('input', (e) => {
        const percent = parseInt(e.target.value, 10);
        sound.setVolume(percent / 100);
        this.updateSoundUI();
      });

      this.volumeSlider.addEventListener('change', () => {
        sound.playTestSound();
      });
    }

    // Mute Button in popover
    if (this.soundMuteBtn) {
      this.soundMuteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.toggleMute();
        this.updateSoundUI();
        if (!sound.isMuted()) {
          sound.playTestSound();
        }
      });
    }

    // Test Sound Button
    if (this.soundTestBtn) {
      this.soundTestBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (sound.isMuted()) {
          sound.setMute(false);
        }
        this.updateSoundUI();
        sound.playTestSound();
      });
    }

    // Close popover when clicking anywhere outside
    document.addEventListener('click', (e) => {
      if (this.soundPopover && !this.soundPopover.classList.contains('hidden')) {
        const isInside = e.target.closest('.sound-control-wrapper');
        if (!isInside) {
          this.closeSoundPopover();
        }
      }
    });
  }

  closeSoundPopover() {
    if (this.soundPopover) {
      this.soundPopover.classList.add('hidden');
      if (this.soundBtn) {
        this.soundBtn.setAttribute('aria-expanded', 'false');
      }
    }
  }

  updateSoundUI() {
    const isMuted = sound.isMuted();
    const volumePercent = sound.getVolumePercent();

    if (this.volumeSlider) {
      this.volumeSlider.value = isMuted ? 0 : volumePercent;
    }

    if (this.volumeVal) {
      this.volumeVal.textContent = isMuted ? '0% (Muted)' : `${volumePercent}%`;
    }

    if (this.soundBtnIcon) {
      this.soundBtnIcon.textContent = isMuted ? '🔇' : (volumePercent < 40 ? '🔉' : '🔊');
    }

    if (this.soundBtnLabel) {
      this.soundBtnLabel.textContent = isMuted ? 'Muted' : 'Sound FX';
    }

    if (this.soundMuteBtn) {
      this.soundMuteBtn.textContent = isMuted ? '🔊 Unmute' : '🔇 Mute';
      if (isMuted) {
        this.soundMuteBtn.classList.remove('bg-paper');
        this.soundMuteBtn.classList.add('bg-secondary');
      } else {
        this.soundMuteBtn.classList.remove('bg-secondary');
        this.soundMuteBtn.classList.add('bg-paper');
      }
    }
  }
}

// Boot application
window.addEventListener('DOMContentLoaded', () => {
  window.arcadeApp = new PaperArcadeApp();
  window.arcadeApp.init();
});
