from flask import jsonify, request
from data.store import arcade_store

def get_scores():
    try:
        scores = arcade_store.get_scores()
        return jsonify({"scores": scores})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def reset_scores():
    try:
        data = request.get_json() or {}
        game = data.get("game")
        scores = arcade_store.reset_game_scores(game)
        return jsonify({"message": f"Scorecard reset for {game or 'all'}", "scores": scores})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
