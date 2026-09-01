// ==========================================================================
// TABLE 03: HANGMAN (WORDS VS CLOCK)
// ==========================================================================

import { api } from './api.js';
import { sound } from './sound.js';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export class HangmanGame {
  constructor(app) {
    this.app = app;
    this.sessionId = null;
    this.maskedWord = '';
    this.category = 'all';
    this.hint = '';
    this.guessedLetters = new Set();
    this.mistakes = 0;
    this.maxMistakes = 6;
    this.isGameOver = false;
  }

  init() {
    this.wordDisplayEl = document.getElementById('hangman-word-display');
    this.keyboardEl = document.getElementById('hangman-keyboard');
    this.hintTextEl = document.getElementById('hangman-hint-text');
    this.catBadgeEl = document.getElementById('hangman-category-badge');
    this.mistakesEl = document.getElementById('hangman-mistakes-text');
    this.winsScoreEl = document.getElementById('hangman-score-wins');
    this.lossesScoreEl = document.getElementById('hangman-score-losses');
    this.streakScoreEl = document.getElementById('hangman-score-streak');
    this.newWordBtn = document.getElementById('hangman-new-word-btn');
    this.catSelect = document.getElementById('hangman-category-select');

    // SVG elements for hangman stages
    this.svgStages = [
      document.getElementById('hm-head'),
      document.getElementById('hm-body'),
      document.getElementById('hm-arm-l'),
      document.getElementById('hm-arm-r'),
      document.getElementById('hm-leg-l'),
      document.getElementById('hm-leg-r')
    ];

    if (this.newWordBtn) {
      this.newWordBtn.addEventListener('click', () => {
        sound.playClick();
        this.startNewGame();
      });
    }

    if (this.catSelect) {
      this.catSelect.addEventListener('change', (e) => {
        this.category = e.target.value;
        this.startNewGame();
      });
    }

    // Physical keyboard listener
    window.addEventListener('keydown', (e) => {
      const char = e.key.toUpperCase();
      const isWordsActive = document.getElementById('view-words')?.classList.contains('active');
      const isModalOpen = document.getElementById('modal-overlay')?.classList.contains('active');
      if (/^[A-Z]$/.test(char) && isWordsActive && !isModalOpen) {
        this.handleGuess(char);
      }
    });

    this.renderKeyboard();
    this.startNewGame();
  }

  // Called whenever user opens / navigates to the Hangman table
  onEnterView() {
    if (this.isGameOver || !this.sessionId) {
      this.startNewGame();
    }
  }

  async startNewGame() {
    this.guessedLetters.clear();
    this.mistakes = 0;
    this.isGameOver = false;
    this.resetGallowsDrawing();

    try {
      const data = await api.startHangman(this.category);
      this.sessionId = data.sessionId;
      this.maskedWord = data.maskedWord;
      this.hint = data.hint;
      this.category = data.category;
      this.maxMistakes = data.maxMistakes || 6;

      if (this.catBadgeEl) this.catBadgeEl.textContent = this.category.toUpperCase();
      if (this.hintTextEl) this.hintTextEl.textContent = `💡 Hint: ${this.hint}`;
      if (this.mistakesEl) this.mistakesEl.textContent = `Mistakes: 0 / ${this.maxMistakes}`;

      if (data.scores) this.updateScorecard(data.scores);

      this.renderWord(this.maskedWord);
      this.renderKeyboard();
    } catch (err) {
      console.error('Hangman Start Error:', err);
    }
  }

  async handleGuess(letter) {
    if (this.isGameOver || this.guessedLetters.has(letter)) return;

    sound.playClick();
    this.guessedLetters.add(letter);

    try {
      const data = await api.guessHangman(this.sessionId, letter);
      this.mistakes = data.mistakes;

      if (data.isCorrect) {
        sound.playMark();
      } else {
        sound.playCard();
      }

      this.updateGallowsDrawing(this.mistakes);
      if (this.mistakesEl) this.mistakesEl.textContent = `Mistakes: ${this.mistakes} / ${this.maxMistakes}`;

      this.renderWord(data.maskedWord);
      this.updateKeyStatus(letter, data.isCorrect);

      if (data.scores) this.updateScorecard(data.scores);

      if (data.isGameOver) {
        this.isGameOver = true;
        if (data.isWin) {
          sound.playWin();
          this.app.showModal({
            emoji: '🎉',
            title: 'Word Solved!',
            message: `Magnificent! You guessed "${data.revealedWord}" with ${this.mistakes} mistakes.`,
            actionText: 'Next Word',
            onAction: () => this.startNewGame()
          });
        } else {
          sound.playLoss();
          this.app.showModal({
            emoji: '💀',
            title: 'Hanged!',
            message: `Out of attempts! The mystery word was "${data.revealedWord}".`,
            actionText: 'Try Another',
            onAction: () => this.startNewGame()
          });
        }
      }
    } catch (err) {
      console.error('Hangman Guess Error:', err);
    }
  }

  renderWord(word) {
    if (!this.wordDisplayEl) return;
    this.wordDisplayEl.innerHTML = '';

    word.split('').forEach(char => {
      const slot = document.createElement('div');
      if (char === ' ') {
        slot.className = 'letter-slot space';
      } else {
        slot.className = 'letter-slot';
        slot.textContent = char === '_' ? '' : char;
        if (char !== '_') slot.classList.add('revealed');
      }
      this.wordDisplayEl.appendChild(slot);
    });
  }

  renderKeyboard() {
    if (!this.keyboardEl) return;
    this.keyboardEl.innerHTML = '';

    ALPHABET.forEach(char => {
      const key = document.createElement('button');
      key.className = 'chunky key-btn';
      key.textContent = char;
      key.dataset.letter = char;
      key.addEventListener('click', () => this.handleGuess(char));
      this.keyboardEl.appendChild(key);
    });
  }

  updateKeyStatus(letter, isCorrect) {
    if (!this.keyboardEl) return;
    const btn = this.keyboardEl.querySelector(`[data-letter="${letter}"]`);
    if (btn) {
      btn.disabled = true;
      btn.classList.add(isCorrect ? 'used-correct' : 'used-wrong');
    }
  }

  resetGallowsDrawing() {
    this.svgStages.forEach(el => {
      if (el) el.style.opacity = '0';
    });
  }

  updateGallowsDrawing(mistakes) {
    for (let i = 0; i < this.svgStages.length; i++) {
      if (this.svgStages[i]) {
        this.svgStages[i].style.opacity = i < mistakes ? '1' : '0';
      }
    }
  }

  updateScorecard(scores) {
    if (this.winsScoreEl) this.winsScoreEl.textContent = scores.wins ?? 0;
    if (this.lossesScoreEl) this.lossesScoreEl.textContent = scores.losses ?? 0;
    if (this.streakScoreEl) this.streakScoreEl.textContent = scores.currentStreak ?? 0;
  }
}
