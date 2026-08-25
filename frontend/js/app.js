// ==========================================================================
// PAPER ARCADE - MAIN APP & ROUTER
// ==========================================================================

import { sound } from './sound.js';
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

    // Handle initial hash or default to lobby
    const hash = window.location.hash.replace('#', '') || 'lobby';
    this.navigate(hash);

    window.addEventListener('hashchange', () => {
      const newHash = window.location.hash.replace('#', '') || 'lobby';
      this.navigate(newHash);
    });
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll('a[data-view]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.dataset.view;
        sound.playClick();
        window.location.hash = view;
      });
    });
  }

  navigate(viewName) {
    const views = ['lobby', 'hands', 'grid', 'words'];
    if (!views.includes(viewName)) viewName = 'lobby';
    this.currentView = viewName;

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
        this.hideModal();
        if (typeof this.modalCallback === 'function') {
          this.modalCallback();
        }
      });
    }

    if (this.modalLobbyBtn) {
      this.modalLobbyBtn.addEventListener('click', () => {
        sound.playClick();
        this.hideModal();
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
    if (this.modalOverlay) {
      this.modalOverlay.classList.remove('active');
    }
  }

  setupSoundToggle() {
    this.soundBtn = document.getElementById('sound-toggle-btn');
    if (!this.soundBtn) return;

    this.updateSoundBtnText();

    this.soundBtn.addEventListener('click', () => {
      sound.toggleMute();
      this.updateSoundBtnText();
      if (!sound.isMuted()) {
        sound.playClick();
      }
    });
  }

  updateSoundBtnText() {
    if (this.soundBtn) {
      this.soundBtn.textContent = sound.isMuted() ? '🔇 Muted' : '🔊 Sound FX';
    }
  }
}

// Boot application
window.addEventListener('DOMContentLoaded', () => {
  window.arcadeApp = new PaperArcadeApp();
  window.arcadeApp.init();
});
