// ==========================================================================
// TABLE 01: ROCK PAPER SCISSORS (HANDS VS BOT) - MATCH SERIES (BEST OF 3/5/ENDLESS)
// ==========================================================================

import { api } from './api.js';
import { sound } from './sound.js';

const EMOJI_MAP = {
  rock: '🪨',
  paper: '📄',
  scissors: '✂️'
};

export class RpsGame {
  constructor(app) {
    this.app = app;
    this.isAnimating = false;
    this.seriesMode = 'best3'; // 'best3', 'best5', 'endless'
    this.scores = {
      playerWins: 0,
      botWins: 0,
      ties: 0,
      currentStreak: 0,
      bestStreak: 0,
      history: [],
      seriesPlayerWins: 0,
      seriesBotWins: 0
    };
  }

  init() {
    this.playerCardEl = document.getElementById('rps-player-card');
    this.botCardEl = document.getElementById('rps-bot-card');
    this.statusTextEl = document.getElementById('rps-status-text');
    this.playerScoreEl = document.getElementById('rps-score-player');
    this.tiesScoreEl = document.getElementById('rps-score-ties');
    this.botScoreEl = document.getElementById('rps-score-bot');
    this.streakEl = document.getElementById('rps-streak-count');
    this.historyListEl = document.getElementById('rps-history-list');
    this.choiceBtns = document.querySelectorAll('.rps-choice-btn');
    this.modeSelect = document.getElementById('rps-mode-select');
    this.seriesTrackerEl = document.getElementById('rps-series-tracker');
    this.resetSeriesBtn = document.getElementById('rps-reset-series-btn');

    if (this.modeSelect) {
      this.modeSelect.addEventListener('change', (e) => {
        this.seriesMode = e.target.value;
        this.resetSeries();
      });
    }

    if (this.resetSeriesBtn) {
      this.resetSeriesBtn.addEventListener('click', () => {
        sound.playClick();
        this.resetSeries();
      });
    }

    this.choiceBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const move = btn.dataset.move;
        this.playRound(move);
      });
    });

    this.updateSeriesDisplay();
  }

  async playRound(playerMove) {
    if (this.isAnimating) return;
    this.isAnimating = true;
    sound.playCard();

    // Reset card visuals with countdown
    this.setPlayerVisual(EMOJI_MAP[playerMove], playerMove.toUpperCase());
    this.setBotVisual('❓', 'THINKING...');
    this.setStatus('Rock... Paper... Scissors... Shoot!');

    this.disableChoiceButtons(true);

    try {
      const data = await api.playRps(playerMove, this.seriesMode);

      setTimeout(() => {
        this.setBotVisual(EMOJI_MAP[data.botMove], data.botMove.toUpperCase());
        this.isAnimating = false;
        this.disableChoiceButtons(false);

        if (data.scores) {
          this.updateScorecard(data.scores);
          this.renderHistory(data.scores.history || []);
        }

        const series = data.series || {};

        if (series.isSeriesOver) {
          if (series.seriesWinner === 'player') {
            sound.playWin();
            this.setStatus(`🏆 MATCH SERIES CHAMPION! You won the ${this.getModeLabel()}!`);
            this.app.showModal({
              emoji: '👑',
              title: 'Series Champion!',
              message: `Spectacular! You clinched the match ${series.playerWins} - ${series.botWins} against the bot.`,
              actionText: 'Start New Match',
              onAction: () => this.resetSeries()
            });
          } else {
            sound.playLoss();
            this.setStatus(`💥 MATCH SERIES OVER! Bot took the ${this.getModeLabel()}.`);
            this.app.showModal({
              emoji: '💀',
              title: 'Series Lost!',
              message: `The Bot secured the series ${series.botWins} - ${series.playerWins}. Time for revenge!`,
              actionText: 'Rematch Series',
              onAction: () => this.resetSeries()
            });
          }
        } else {
          // Regular round result
          if (data.result === 'win') {
            sound.playWin();
            this.setStatus(`🎉 You Win Hand! ${data.explanation}`);
          } else if (data.result === 'lose') {
            sound.playLoss();
            this.setStatus(`🤖 Bot Scores Hand! ${data.explanation}`);
          } else {
            sound.playDraw();
            this.setStatus(`🤝 Stalemate Hand! ${data.explanation}`);
          }
        }

        this.updateSeriesDisplay(series);
      }, 450);
    } catch (err) {
      console.error('RPS error:', err);
      this.isAnimating = false;
      this.disableChoiceButtons(false);
    }
  }

  getModeLabel() {
    if (this.seriesMode === 'best3') return 'Best of 3 (First to 2)';
    if (this.seriesMode === 'best5') return 'Best of 5 (First to 3)';
    return 'Endless Mode';
  }

  updateSeriesDisplay(series) {
    if (!this.seriesTrackerEl) return;
    const target = this.seriesMode === 'best3' ? 2 : this.seriesMode === 'best5' ? 3 : null;
    const pWins = series ? series.playerWins : (this.scores.seriesPlayerWins || 0);
    const bWins = series ? series.botWins : (this.scores.seriesBotWins || 0);

    if (target) {
      this.seriesTrackerEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>Match: <strong>${this.getModeLabel()}</strong></span>
          <span style="font-family: var(--font-display); font-size: 1.1rem; color: var(--primary);">
            You ${pWins}/${target} - ${bWins}/${target} Bot
          </span>
        </div>
      `;
    } else {
      this.seriesTrackerEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>Match: <strong>Endless Mode</strong></span>
          <span style="font-family: var(--font-display); color: var(--ink-muted);">Infinite Rematches</span>
        </div>
      `;
    }
  }

  async resetSeries() {
    this.resetFighterCards();
    try {
      const data = await api.resetRpsSeries(this.seriesMode);
      if (data.scores) {
        this.updateScorecard(data.scores);
      }
    } catch (e) {
      console.warn('Series reset local fallback');
    }
    this.scores.seriesPlayerWins = 0;
    this.scores.seriesBotWins = 0;
    this.updateSeriesDisplay();
    this.setStatus(`New ${this.getModeLabel()} match started! Make your move.`);
  }

  setPlayerVisual(emoji, label) {
    if (this.playerCardEl) {
      this.playerCardEl.querySelector('.fighter-emoji').textContent = emoji;
      this.playerCardEl.querySelector('.fighter-name').textContent = label;
      this.playerCardEl.classList.add('pop-in');
      setTimeout(() => this.playerCardEl.classList.remove('pop-in'), 300);
    }
  }

  setBotVisual(emoji, label) {
    if (this.botCardEl) {
      this.botCardEl.querySelector('.fighter-emoji').textContent = emoji;
      this.botCardEl.querySelector('.fighter-name').textContent = label;
      this.botCardEl.classList.add('pop-in');
      setTimeout(() => this.botCardEl.classList.remove('pop-in'), 300);
    }
  }

  resetFighterCards() {
    this.setPlayerVisual('🫲', 'YOU');
    this.setBotVisual('🫱', 'BOT');
    this.setStatus('Choose your hand below');
  }

  setStatus(text) {
    if (this.statusTextEl) {
      this.statusTextEl.textContent = text;
    }
  }

  disableChoiceButtons(disabled) {
    this.choiceBtns.forEach(btn => btn.disabled = disabled);
  }

  updateScorecard(scores) {
    this.scores = scores;
    if (this.playerScoreEl) this.playerScoreEl.textContent = scores.playerWins ?? 0;
    if (this.tiesScoreEl) this.tiesScoreEl.textContent = scores.ties ?? 0;
    if (this.botScoreEl) this.botScoreEl.textContent = scores.botWins ?? 0;
    if (this.streakEl) this.streakEl.textContent = `${scores.currentStreak ?? 0} (Best: ${scores.bestStreak ?? 0})`;
  }

  renderHistory(history) {
    if (!this.historyListEl) return;
    this.historyListEl.innerHTML = '';

    if (!history.length) {
      this.historyListEl.innerHTML = '<p class="text-xs text-muted">No rounds played yet.</p>';
      return;
    }

    history.slice(0, 8).forEach(item => {
      const row = document.createElement('div');
      row.className = `rps-history-item ${item.result}`;
      row.innerHTML = `
        <span>${EMOJI_MAP[item.playerMove] || ''} vs ${EMOJI_MAP[item.botMove] || ''}</span>
        <span class="text-xs uppercase">${item.result}</span>
      `;
      this.historyListEl.appendChild(row);
    });
  }
}
