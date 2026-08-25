// ==========================================================================
// TABLE 02: TIC TAC TOE (GRID VS BOT)
// ==========================================================================

import { api } from './api.js';
import { sound } from './sound.js';

export class TicTacToeGame {
  constructor(app) {
    this.app = app;
    this.board = Array(9).fill(null);
    this.isBotThinking = false;
    this.isGameOver = false;
    this.difficulty = 'impossible'; // 'impossible', 'medium', 'easy'
    this.scores = { playerWins: 0, botWins: 0, draws: 0 };
  }

  init() {
    this.gridEl = document.getElementById('ttt-grid');
    this.statusTextEl = document.getElementById('ttt-status-text');
    this.playerScoreEl = document.getElementById('ttt-score-player');
    this.drawsScoreEl = document.getElementById('ttt-score-draws');
    this.botScoreEl = document.getElementById('ttt-score-bot');
    this.newRoundBtn = document.getElementById('ttt-new-round-btn');
    this.diffSelect = document.getElementById('ttt-difficulty-select');

    if (this.newRoundBtn) {
      this.newRoundBtn.addEventListener('click', () => {
        sound.playClick();
        this.resetBoard();
      });
    }

    if (this.diffSelect) {
      this.diffSelect.addEventListener('change', (e) => {
        this.difficulty = e.target.value;
      });
    }

    this.render();
  }

  // Called whenever user opens / navigates to the Tic Tac Toe table
  onEnterView() {
    this.resetBoard();
  }

  render() {
    if (!this.gridEl) return;
    this.gridEl.innerHTML = '';

    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('button');
      cell.className = 'ttt-cell';
      cell.setAttribute('aria-label', `Cell ${i + 1}`);
      cell.dataset.index = i;

      const val = this.board[i];
      if (val === 'X') {
        cell.innerHTML = '<span class="mark-x">X</span>';
        cell.disabled = true;
      } else if (val === 'O') {
        cell.innerHTML = '<span class="mark-o">O</span>';
        cell.disabled = true;
      } else {
        cell.disabled = this.isGameOver || this.isBotThinking;
        cell.addEventListener('click', () => this.handleCellClick(i));
      }

      this.gridEl.appendChild(cell);
    }
  }

  async handleCellClick(index) {
    if (this.board[index] !== null || this.isGameOver || this.isBotThinking) return;

    sound.playMark();
    this.board[index] = 'X';
    this.render();

    // Check client status first
    this.setStatus('Bot is calculating move...');
    this.isBotThinking = true;
    this.disableAllCells(true);

    try {
      const data = await api.makeTttMove(this.board, this.difficulty);
      
      setTimeout(() => {
        this.board = data.board;
        this.isBotThinking = false;
        
        if (data.botMove !== null) {
          sound.playMark();
        }

        this.render();

        if (data.scores) {
          this.updateScorecard(data.scores);
        }

        if (data.winningLine) {
          this.highlightWinningLine(data.winningLine);
        }

        if (data.winner === 'X') {
          this.isGameOver = true;
          this.setStatus('🎉 Victory! You outsmarted the bot!');
          sound.playWin();
          this.app.showModal({
            emoji: '🏆',
            title: 'Victory!',
            message: 'Incredible! You defeated the Minimax bot on the paper grid.',
            actionText: 'Next Round',
            onAction: () => this.resetBoard()
          });
        } else if (data.winner === 'O') {
          this.isGameOver = true;
          this.setStatus('🤖 Bot wins this round!');
          sound.playLoss();
          this.app.showModal({
            emoji: '💥',
            title: 'Bot Wins',
            message: 'The Minimax opponent seized the winning opportunity.',
            actionText: 'Rematch',
            onAction: () => this.resetBoard()
          });
        } else if (data.isDraw) {
          this.isGameOver = true;
          this.setStatus('🤝 Stalemate — well played!');
          sound.playDraw();
          this.app.showModal({
            emoji: '🤝',
            title: 'Draw',
            message: 'Nobody blinked. Grinding out draws against Minimax is the real game!',
            actionText: 'Next Round',
            onAction: () => this.resetBoard()
          });
        } else {
          this.setStatus('Your turn (X) — pick a square');
          this.disableAllCells(false);
        }
      }, 250); // slight tactile delay for realistic bot thinking
    } catch (err) {
      console.error('TTT move error:', err);
      this.isBotThinking = false;
      this.disableAllCells(false);
    }
  }

  highlightWinningLine(line) {
    line.forEach(idx => {
      const cell = this.gridEl.children[idx];
      if (cell) cell.classList.add('winning-cell');
    });
  }

  disableAllCells(disabled) {
    if (!this.gridEl) return;
    Array.from(this.gridEl.children).forEach(cell => {
      if (!this.board[cell.dataset.index]) {
        cell.disabled = disabled;
      }
    });
  }

  setStatus(text) {
    if (this.statusTextEl) {
      this.statusTextEl.textContent = text;
    }
  }

  updateScorecard(scores) {
    this.scores = scores;
    if (this.playerScoreEl) this.playerScoreEl.textContent = scores.playerWins ?? 0;
    if (this.drawsScoreEl) this.drawsScoreEl.textContent = scores.draws ?? 0;
    if (this.botScoreEl) this.botScoreEl.textContent = scores.botWins ?? 0;
  }

  resetBoard() {
    this.board = Array(9).fill(null);
    this.isGameOver = false;
    this.isBotThinking = false;
    this.setStatus('Your turn (X) — pick a square');
    this.render();
  }
}
