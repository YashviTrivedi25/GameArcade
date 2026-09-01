// ==========================================================================
// PAPER ARCADE - API CLIENT
// Connects to Node.js Backend with intelligent offline fallback
// ==========================================================================

const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? `${window.location.origin}/api`
  : 'http://localhost:3001/api';

export const api = {
  // Tic-Tac-Toe Move
  async makeTttMove(board, difficulty = 'impossible') {
    try {
      const res = await fetch(`${API_BASE}/ttt/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board, difficulty })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[Paper Arcade] Backend offline, using client fallback for TTT:', err);
      return this._fallbackTtt(board);
    }
  },

  // Tic-Tac-Toe 2-Player (PvP) Score Record
  async recordTttPvp(outcome) {
    try {
      const res = await fetch(`${API_BASE}/ttt/pvp-record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[Paper Arcade] Backend offline, recording PvP score locally:', err);
      return { scores: null };
    }
  },

  // Rock-Paper-Scissors Play
  async playRps(move, mode = 'best3') {
    try {
      const res = await fetch(`${API_BASE}/rps/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move, mode })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[Paper Arcade] Backend offline, using client fallback for RPS:', err);
      return this._fallbackRps(move, mode);
    }
  },

  // Reset RPS Series
  async resetRpsSeries(mode = 'best3') {
    try {
      const res = await fetch(`${API_BASE}/rps/reset-series`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      return { message: 'Reset locally' };
    }
  },

  // Hangman Start Game
  async startHangman(category = 'all') {
    try {
      const res = await fetch(`${API_BASE}/hangman/new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[Paper Arcade] Backend offline, using client fallback for Hangman:', err);
      return this._fallbackHangmanStart();
    }
  },

  // Hangman Guess Letter
  async guessHangman(sessionId, letter) {
    try {
      const res = await fetch(`${API_BASE}/hangman/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, letter })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[Paper Arcade] Backend offline, using client fallback for Guess:', err);
      return this._fallbackHangmanGuess(letter);
    }
  },

  // Get Scores
  async getScores() {
    try {
      const res = await fetch(`${API_BASE}/scores`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      return { scores: JSON.parse(localStorage.getItem('paper_arcade_scores') || '{}') };
    }
  },

  // Reset Scores
  async resetScores(game) {
    try {
      const res = await fetch(`${API_BASE}/scores/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      return { message: 'Reset locally' };
    }
  },

  // ---- Offline Fallback Helpers ----
  _fallbackTtt(board) {
    const avail = board.map((v, i) => (v === null || v === '' ? i : null)).filter(v => v !== null);
    const botMove = avail.length > 0 ? avail[Math.floor(Math.random() * avail.length)] : null;
    const newBoard = [...board];
    if (botMove !== null) newBoard[botMove] = 'O';
    return {
      botMove,
      board: newBoard,
      winner: null,
      isDraw: avail.length <= 1,
      scores: { playerWins: 0, botWins: 0, draws: 0 }
    };
  },

  _fallbackRps(playerMove) {
    const moves = ['rock', 'paper', 'scissors'];
    const botMove = moves[Math.floor(Math.random() * moves.length)];
    let result = 'tie';
    if (playerMove === botMove) result = 'tie';
    else if (
      (playerMove === 'rock' && botMove === 'scissors') ||
      (playerMove === 'paper' && botMove === 'rock') ||
      (playerMove === 'scissors' && botMove === 'paper')
    ) result = 'win';
    else result = 'lose';

    return {
      playerMove,
      botMove,
      result,
      explanation: `${playerMove.toUpperCase()} vs ${botMove.toUpperCase()}`,
      scores: { playerWins: result === 'win' ? 1 : 0, botWins: result === 'lose' ? 1 : 0, ties: result === 'tie' ? 1 : 0 }
    };
  },

  _fallbackHangmanStart() {
    this._offlineWord = 'ARCADE';
    this._offlineGuessed = new Set();
    this._offlineMistakes = 0;
    return {
      sessionId: 'offline_1',
      category: 'Arcade Classics',
      hint: 'Classic gaming venue',
      maskedWord: '______',
      guessedLetters: [],
      mistakes: 0,
      maxMistakes: 6,
      isGameOver: false,
      isWin: false,
      scores: { wins: 0, losses: 0 }
    };
  },

  _fallbackHangmanGuess(letter) {
    const char = letter.toUpperCase();
    this._offlineGuessed.add(char);
    const isCorrect = this._offlineWord.includes(char);
    if (!isCorrect) this._offlineMistakes++;
    const masked = this._offlineWord.split('').map(c => this._offlineGuessed.has(c) ? c : '_').join('');
    const isWin = !masked.includes('_');
    const isGameOver = isWin || this._offlineMistakes >= 6;
    return {
      sessionId: 'offline_1',
      letter: char,
      isCorrect,
      maskedWord: isGameOver && !isWin ? this._offlineWord : masked,
      revealedWord: isGameOver ? this._offlineWord : null,
      guessedLetters: Array.from(this._offlineGuessed),
      mistakes: this._offlineMistakes,
      maxMistakes: 6,
      isGameOver,
      isWin,
      scores: { wins: isWin ? 1 : 0, losses: isGameOver && !isWin ? 1 : 0 }
    };
  }
};
