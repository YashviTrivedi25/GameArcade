import random
import math
from flask import jsonify, request
from data.store import arcade_store

WINNING_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],  # Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8],  # Columns
    [0, 4, 8], [2, 4, 6]              # Diagonals
]

def check_winner(board):
    for combo in WINNING_COMBOS:
        a, b, c = combo
        if board[a] and board[a] == board[b] and board[a] == board[c]:
            return {"winner": board[a], "line": combo, "isDraw": False}
    if all(cell is not None and cell != "" for cell in board):
        return {"winner": None, "line": None, "isDraw": True}
    return {"winner": None, "line": None, "isDraw": False}

def minimax(new_board, player, depth=0, alpha=-math.inf, beta=math.inf):
    avail_spots = [idx for idx, val in enumerate(new_board) if val is None or val == ""]
    
    eval_result = check_winner(new_board)
    if eval_result["winner"] == "O":
        return {"score": 10 - depth, "index": None}
    if eval_result["winner"] == "X":
        return {"score": depth - 10, "index": None}
    if eval_result["isDraw"] or not avail_spots:
        return {"score": 0, "index": None}

    best_move = None

    if player == "O":
        max_eval = -math.inf
        for spot in avail_spots:
            new_board[spot] = "O"
            result = minimax(new_board, "X", depth + 1, alpha, beta)
            new_board[spot] = None
            if result["score"] > max_eval:
                max_eval = result["score"]
                best_move = spot
            alpha = max(alpha, max_eval)
            if beta <= alpha:
                break
        return {"score": max_eval, "index": best_move}
    else:
        min_eval = math.inf
        for spot in avail_spots:
            new_board[spot] = "X"
            result = minimax(new_board, "O", depth + 1, alpha, beta)
            new_board[spot] = None
            if result["score"] < min_eval:
                min_eval = result["score"]
                best_move = spot
            beta = min(beta, min_eval)
            if beta <= alpha:
                break
        return {"score": min_eval, "index": best_move}

def handle_ttt_move():
    try:
        data = request.get_json() or {}
        board = data.get("board", [])
        difficulty = data.get("difficulty", "impossible")

        if not isinstance(board, list) or len(board) != 9:
            return jsonify({"error": "Invalid board shape. Must be an array of length 9."}), 400

        initial_check = check_winner(board)
        if initial_check["winner"] or initial_check["isDraw"]:
            outcome = "player" if initial_check["winner"] == "X" else "bot" if initial_check["winner"] == "O" else "draw"
            updated_scores = arcade_store.update_ttt_score(outcome)
            return jsonify({
                "botMove": None,
                "winner": initial_check["winner"],
                "winningLine": initial_check["line"],
                "isDraw": initial_check["isDraw"],
                "board": board,
                "scores": updated_scores
            })

        avail_spots = [idx for idx, val in enumerate(board) if val is None or val == ""]
        if not avail_spots:
            updated_scores = arcade_store.update_ttt_score("draw")
            return jsonify({
                "botMove": None,
                "winner": None,
                "winningLine": None,
                "isDraw": True,
                "board": board,
                "scores": updated_scores
            })

        if difficulty == "easy":
            bot_move_index = random.choice(avail_spots)
        elif difficulty == "medium" and random.random() < 0.35:
            bot_move_index = random.choice(avail_spots)
        else:
            minimax_res = minimax(list(board), "O")
            bot_move_index = minimax_res["index"] if minimax_res["index"] is not None else avail_spots[0]

        new_board = list(board)
        new_board[bot_move_index] = "O"

        final_check = check_winner(new_board)
        scores = arcade_store.get_scores()["ttt"]

        if final_check["winner"] or final_check["isDraw"]:
            outcome = "bot" if final_check["winner"] == "O" else "player" if final_check["winner"] == "X" else "draw"
            scores = arcade_store.update_ttt_score(outcome)

        return jsonify({
            "botMove": bot_move_index,
            "winner": final_check["winner"],
            "winningLine": final_check["line"],
            "isDraw": final_check["isDraw"],
            "board": new_board,
            "scores": scores
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
