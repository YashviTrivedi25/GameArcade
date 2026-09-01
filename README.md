# 🕹️ Paper Arcade — Fullstack Game Suite (Python + JavaScript)

A clean, beautiful, and tactile retro paper notebook arcade featuring three games powered by a **Python (Flask)** backend and a **Vanilla JavaScript** frontend with zero tracking scripts or bloat.

---

## 📁 Project Structure

```
GameArcade/
├── backend/
│   ├── app.py                         # Main Flask application & static server
│   ├── requirements.txt               # Flask, flask-cors dependencies
│   ├── controllers/
│   │   ├── __init__.py
│   │   ├── ttt_controller.py          # Python Minimax AI Bot (unbeatable)
│   │   ├── rps_controller.py          # Python Predictive AI Bot & Round Evaluator
│   │   ├── hangman_controller.py      # Python Secret Word Generator & Guess Validator
│   │   └── score_controller.py        # Python Scorecard Persistence & Stats
│   ├── routes/
│   │   ├── __init__.py
│   │   └── api.py                     # Flask API Blueprint (/api/ttt, /api/rps, /api/hangman, /api/scores)
│   └── data/
│       ├── words.json                 # Curated word banks by category
│       └── store.py                   # In-memory & session score store
│
├── frontend/
│   ├── index.html                     # Unified Paper Arcade Portal (Lobby, Hands, Grid, Words)
│   ├── css/
│   │   └── paper-arcade.css           # Paper notebook design system (chunky borders, ink shadows)
│   ├── js/
│   │   ├── api.js                     # Backend API client with offline fallback
│   │   ├── sound.js                   # Web Audio API procedural sound FX
│   │   ├── ttt.js                     # Table 02: Tic Tac Toe vs Minimax Bot
│   │   ├── rps.js                     # Table 01: Rock Paper Scissors vs Bot
│   │   ├── hangman.js                 # Table 03: Hangman with SVG paper drawings
│   │   └── app.js                     # View router & modal system
│   └── assets/
│       └── images/                    # Clean game thumbnails
│
├── package.json                       # Root script configuration
├── ARCHITECTURE.md                   # Full technical specification & technology comparison
└── README.md                          # Project documentation
```

> 📖 **Deep Dive**: For a complete analysis of why each technology and algorithm was chosen alongside alternative tech comparisons, see [ARCHITECTURE.md](file:///Users/yashvitrivedi/Desktop/GameArcade/ARCHITECTURE.md).


---

## 🚀 Getting Started

### 1. Install Python Dependencies
```bash
pip install -r backend/requirements.txt
```

### 2. Start the Backend Server
```bash
python3 backend/app.py
```
*(Or run `npm start` from root)*

Open your browser at:
👉 **[http://localhost:3001](http://localhost:3001)**

---

## 🎮 Included Tables

1. **Table 01: Hands (Rock Paper Scissors)**
   - Predictive Python AI bot analyzing player move frequencies
   - Win streak tracking & round history ticker
   - Tactical feedback and scorecards

2. **Table 02: Grid (Tic Tac Toe)**
   - Unbeatable recursive Python Minimax AI Bot with alpha-beta pruning
   - Configurable difficulty: *Impossible*, *Medium*, *Easy*
   - Winning stroke highlights and draw tracking

3. **Table 03: Words (Hangman)**
   - Real-time SVG paper-drawn hangman with 6 stroke stages
   - Categories: Arcade, Tech & Code, Cosmos & Stars, Nature & Earth
   - On-screen touch keyboard + physical keyboard input support

---

## 🔊 Sound Effects
- Procedural audio synthesized via the browser's Web Audio API (pencil scratches, tactile button clicks, 8-bit winning fanfare). Toggle mute anytime in the header.
