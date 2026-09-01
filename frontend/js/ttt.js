// ==========================================================================
// TABLE 02: TIC TAC TOE (GRID VS BOT / 2 PLAYERS)
// ==========================================================================

import { api } from './api.js';
import { sound } from './sound.js';

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],  // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8],  // Columns
  [0, 4, 8], [2, 4, 6]              // Diagonals
];

export class TicTacToeGame {
  constructor(app) {
    this.app = app;
    this.board = Array(9).fill(null);
    this.gameMode = 'bot'; // 'bot' or 'pvp'
    this.currentPlayer = 'X'; // For PvP mode
    this.isBotThinking = false;
    this.isGameOver = false;
    this.difficulty = 'impossible'; // 'impossible', 'medium', 'easy'
    this.scores = { playerWins: 0, botWins: 0, draws: 0 };
    this.pvpScores = { p1Wins: 0, p2Wins: 0, draws: 0 };
  }

  init() {
    this.gridEl = document.getElementById('ttt-grid');
    this.statusTextEl = document.getElementById('ttt-status-text');
    this.playerScoreEl = document.getElementById('ttt-score-player');
    this.drawsScoreEl = document.getElementById('ttt-score-draws');
    this.botScoreEl = document.getElementById('ttt-score-bot');
    this.playerLabelEl = document.getElementById('ttt-label-player');
    this.botLabelEl = document.getElementById('ttt-label-bot');
    this.statusBadgeEl = document.getElementById('ttt-status-badge');
    this.diffContainerEl = document.getElementById('ttt-difficulty-container');
    this.infoTicketEl = document.getElementById('ttt-info-ticket');
    this.newRoundBtn = document.getElementById('ttt-new-round-btn');
    this.diffSelect = document.getElementById('ttt-difficulty-select');
    this.modeSelect = document.getElementById('ttt-mode-select');

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

    if (this.modeSelect) {
      this.modeSelect.addEventListener('change', (e) => {
        sound.playClick();
        this.gameMode = e.target.value;
        this.updateModeUI();
        this.resetBoard();
      });
    }

    this.updateModeUI();
    this.render();
  }

  updateModeUI() {
    if (this.gameMode === 'pvp') {
      if (this.statusBadgeEl) this.statusBadgeEl.textContent = '2 PLAYERS';
      if (this.playerLabelEl) this.playerLabelEl.textContent = 'Player 1 (X)';
      if (this.botLabelEl) this.botLabelEl.textContent = 'Player 2 (O)';
      if (this.diffContainerEl) this.diffContainerEl.style.display = 'none';
      if (this.infoTicketEl) {
        this.infoTicketEl.textContent = 'Pass & Play: Take turns on the paper grid with a friend!';
      }
      this.updateScorecard();
    } else {
      if (this.statusBadgeEl) this.statusBadgeEl.textContent = 'vs BOT';
      if (this.playerLabelEl) this.playerLabelEl.textContent = 'You (X)';
      if (this.botLabelEl) this.botLabelEl.textContent = 'Bot (O)';
      if (this.diffContainerEl) this.diffContainerEl.style.display = 'flex';
      if (this.infoTicketEl) {
        this.infoTicketEl.textContent = 'The bot calculates optimal Minimax states. Grinding out draws is the real game!';
      }
      this.updateScorecard();
    }
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

  checkLocalWinner(board) {
    for (const combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line: combo, isDraw: false };
      }
    }
    if (board.every(cell => cell !== null && cell !== '')) {
      return { winner: null, line: null, isDraw: true };
    }
    return { winner: null, line: null, isDraw: false };
  }

  async handleCellClick(index) {
    if (this.board[index] !== null || this.isGameOver || this.isBotThinking) return;

    if (this.gameMode === 'pvp') {
      this.handlePvpMove(index);
    } else {
      this.handleBotMove(index);
    }
  }

  async handlePvpMove(index) {
    sound.playMark();
    const mark = this.currentPlayer;
    this.board[index] = mark;
    this.render();

    const check = this.checkLocalWinner(this.board);

    if (check.winner) {
      this.isGameOver = true;
      this.highlightWinningLine(check.line);
      sound.playWin();

      const outcome = check.winner === 'X' ? 'p1' : 'p2';
      if (outcome === 'p1') {
        this.pvpScores.p1Wins = (this.pvpScores.p1Wins || 0) + 1;
        this.setStatus('🎉 Player 1 (X) Wins!');
        this.app.showModal({
          emoji: '👑',
          title: 'Player 1 Wins!',
          message: 'Player 1 (X) claimed 3 in a row! Ready for the next round?',
          actionText: 'Next Round',
          onAction: () => this.resetBoard()
        });
      } else {
        this.pvpScores.p2Wins = (this.pvpScores.p2Wins || 0) + 1;
        this.setStatus('🎉 Player 2 (O) Wins!');
        this.app.showModal({
          emoji: '👑',
          title: 'Player 2 Wins!',
          message: 'Player 2 (O) claimed 3 in a row! Ready for the rematch?',
          actionText: 'Next Round',
          onAction: () => this.resetBoard()
        });
      }
      this.updateScorecard();
      this.saveAndSyncPvpScore(outcome);
    } else if (check.isDraw) {
      this.isGameOver = true;
      this.pvpScores.draws = (this.pvpScores.draws || 0) + 1;
      this.setStatus('🤝 Stalemate — well played by both!');
      sound.playDraw();
      this.app.showModal({
        emoji: '🤝',
        title: 'Draw!',
        message: 'A hard-fought stalemate between Player 1 and Player 2.',
        actionText: 'Next Round',
        onAction: () => this.resetBoard()
      });
      this.updateScorecard();
      this.saveAndSyncPvpScore('draw');
    } else {
      this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
      const playerNum = this.currentPlayer === 'X' ? '1' : '2';
      this.setStatus(`Player ${playerNum}'s turn (${this.currentPlayer}) — pick a square`);
    }
  }

  async saveAndSyncPvpScore(outcome) {
    try {
      localStorage.setItem('paper_arcade_ttt_pvp', JSON.stringify(this.pvpScores));
      const res = await api.recordTttPvp(outcome);
      if (res && res.scores) {
        this.pvpScores = res.scores;
        this.updateScorecard();
      }
    } catch (err) {
      console.warn('PvP score sync warning:', err);
    }
  }

  async handleBotMove(index) {
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
    if (!line || !this.gridEl) return;
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
    if (this.gameMode === 'pvp') {
      if (this.playerScoreEl) this.playerScoreEl.textContent = this.pvpScores.p1Wins ?? 0;
      if (this.drawsScoreEl) this.drawsScoreEl.textContent = this.pvpScores.draws ?? 0;
      if (this.botScoreEl) this.botScoreEl.textContent = this.pvpScores.p2Wins ?? 0;
    } else {
      if (scores) this.scores = scores;
      if (this.playerScoreEl) this.playerScoreEl.textContent = this.scores.playerWins ?? 0;
      if (this.drawsScoreEl) this.drawsScoreEl.textContent = this.scores.draws ?? 0;
      if (this.botScoreEl) this.botScoreEl.textContent = this.scores.botWins ?? 0;
    }
  }

  resetBoard() {
    this.board = Array(9).fill(null);
    this.isGameOver = false;
    this.isBotThinking = false;
    this.currentPlayer = 'X';

    if (this.gameMode === 'pvp') {
      this.setStatus("Player 1's turn (X) — pick a square");
    } else {
      this.setStatus('Your turn (X) — pick a square');
    }

    this.render();
  }
}

