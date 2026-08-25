import datetime
from flask import Blueprint, jsonify
from controllers.ttt_controller import handle_ttt_move
from controllers.rps_controller import handle_rps_play, handle_rps_reset_series
from controllers.hangman_controller import start_hangman_game, guess_hangman_letter
from controllers.score_controller import get_scores, reset_scores

api_bp = Blueprint('api', __name__)

# Health check
@api_bp.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "game": "Paper Arcade Python Backend v1.0"
    })

# Tic-Tac-Toe Routes
@api_bp.route('/ttt/move', methods=['POST'])
def ttt_move():
    return handle_ttt_move()

# Rock-Paper-Scissors Routes
@api_bp.route('/rps/play', methods=['POST'])
def rps_play():
    return handle_rps_play()

@api_bp.route('/rps/reset-series', methods=['POST'])
def rps_reset_series():
    return handle_rps_reset_series()

# Hangman Routes
@api_bp.route('/hangman/new', methods=['POST'])
def hangman_new():
    return start_hangman_game()

@api_bp.route('/hangman/guess', methods=['POST'])
def hangman_guess():
    return guess_hangman_letter()

# Score & Stats Routes
@api_bp.route('/scores', methods=['GET'])
def scores_get():
    return get_scores()

@api_bp.route('/scores/reset', methods=['POST'])
def scores_reset():
    return reset_scores()
