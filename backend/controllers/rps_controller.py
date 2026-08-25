import random
from flask import jsonify, request
from data.store import arcade_store

MOVES = ["rock", "paper", "scissors"]

WIN_MAP = {
    "rock": "scissors",
    "paper": "rock",
    "scissors": "paper"
}

COUNTER_MAP = {
    "rock": "paper",
    "paper": "scissors",
    "scissors": "rock"
}

MOVE_ICONS = {
    "rock": "🪨 Rock",
    "paper": "📄 Paper",
    "scissors": "✂️ Scissors"
}

player_move_counts = {"rock": 0, "paper": 0, "scissors": 0}
last_player_move = None

def get_bot_move(player_move):
    global last_player_move
    if last_player_move:
        player_move_counts[last_player_move] = player_move_counts.get(last_player_move, 0) + 1
    last_player_move = player_move

    total_moves = sum(player_move_counts.values())
    if total_moves < 2 or random.random() < 0.3:
        return random.choice(MOVES)

    most_frequent_move = max(player_move_counts, key=player_move_counts.get)
    return COUNTER_MAP[most_frequent_move]

def handle_rps_play():
    try:
        data = request.get_json() or {}
        player_move = str(data.get("move", "")).lower().strip()
        mode = str(data.get("mode", "best3")).lower().strip() # best3, best5, endless

        if player_move not in MOVES:
            return jsonify({"error": f"Invalid move. Must be one of: {', '.join(MOVES)}"}), 400

        bot_move = get_bot_move(player_move)

        if player_move == bot_move:
            result = "tie"
            explanation = f"Both threw {MOVE_ICONS[player_move]}. It's a draw!"
        elif WIN_MAP[player_move] == bot_move:
            result = "win"
            explanation = f"{MOVE_ICONS[player_move]} beats {MOVE_ICONS[bot_move]}! You score!"
        else:
            result = "lose"
            explanation = f"{MOVE_ICONS[bot_move]} beats {MOVE_ICONS[player_move]}! Bot scores!"

        updated_scores = arcade_store.update_rps_score(result, player_move, bot_move, mode)

        # Check match series progress
        target_wins = 2 if mode == "best3" else 3 if mode == "best5" else None
        is_series_over = False
        series_winner = None

        if target_wins:
            if updated_scores["seriesPlayerWins"] >= target_wins:
                is_series_over = True
                series_winner = "player"
            elif updated_scores["seriesBotWins"] >= target_wins:
                is_series_over = True
                series_winner = "bot"

        return jsonify({
            "playerMove": player_move,
            "botMove": bot_move,
            "result": result,
            "explanation": explanation,
            "scores": updated_scores,
            "series": {
                "mode": mode,
                "targetWins": target_wins,
                "playerWins": updated_scores["seriesPlayerWins"],
                "botWins": updated_scores["seriesBotWins"],
                "isSeriesOver": is_series_over,
                "seriesWinner": series_winner
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def handle_rps_reset_series():
    try:
        data = request.get_json() or {}
        mode = data.get("mode", "best3")
        scores = arcade_store.reset_rps_series(mode)
        return jsonify({
            "message": "RPS series reset",
            "scores": scores
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
