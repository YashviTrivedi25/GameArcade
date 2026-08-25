import os
import json
import random
import uuid
from flask import jsonify, request
from data.store import arcade_store

DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/words.json")
with open(DATA_PATH, "r", encoding="utf-8") as f:
    words_data = json.load(f)

MAX_MISTAKES = 6
sessions = {}

def mask_word(word, guessed_letters):
    return "".join(
        char if char == " " or not char.isalpha() or char in guessed_letters else "_"
        for char in word
    )

def start_hangman_game():
    try:
        data = request.get_json() or {}
        category = data.get("category", "all")

        pool = []
        if category != "all" and category in words_data.get("categories", {}):
            pool = words_data["categories"][category]
        else:
            for cat_words in words_data.get("categories", {}).values():
                pool.extend(cat_words)

        selected = random.choice(pool)
        word = selected["word"].upper()
        hint = selected["hint"]
        cat_name = category if category != "all" else "General Arcade"

        session_id = f"hm_{uuid.uuid4().hex[:12]}"
        guessed_letters = set()

        sessions[session_id] = {
            "word": word,
            "hint": hint,
            "category": cat_name,
            "guessed_letters": guessed_letters,
            "mistakes": 0
        }

        masked = mask_word(word, guessed_letters)

        return jsonify({
            "sessionId": session_id,
            "category": cat_name,
            "hint": hint,
            "wordLength": len(word.replace(" ", "")),
            "maskedWord": masked,
            "guessedLetters": [],
            "mistakes": 0,
            "maxMistakes": MAX_MISTAKES,
            "isGameOver": False,
            "isWin": False,
            "scores": arcade_store.get_scores()["hangman"]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def guess_hangman_letter():
    try:
        data = request.get_json() or {}
        session_id = data.get("sessionId")
        letter = str(data.get("letter", "")).upper().strip()

        if not session_id or session_id not in sessions:
            return jsonify({"error": "Session not found or expired. Please start a new game."}), 404

        session = sessions[session_id]

        if not letter or len(letter) != 1 or not letter.isalpha():
            return jsonify({"error": "Invalid guess. Must be a single letter A-Z."}), 400

        if letter in session["guessed_letters"]:
            return jsonify({
                "sessionId": session_id,
                "letter": letter,
                "alreadyGuessed": True,
                "maskedWord": mask_word(session["word"], session["guessed_letters"]),
                "guessedLetters": list(session["guessed_letters"]),
                "mistakes": session["mistakes"],
                "maxMistakes": MAX_MISTAKES,
                "isGameOver": False,
                "isWin": False,
                "scores": arcade_store.get_scores()["hangman"]
            })

        session["guessed_letters"].add(letter)
        is_correct = letter in session["word"]

        if not is_correct:
            session["mistakes"] += 1

        masked = mask_word(session["word"], session["guessed_letters"])
        is_win = "_" not in masked
        is_loss = session["mistakes"] >= MAX_MISTAKES
        is_game_over = is_win or is_loss

        scores = arcade_store.get_scores()["hangman"]

        if is_game_over:
            scores = arcade_store.update_hangman_score(is_win, session["mistakes"], session["word"])

        return jsonify({
            "sessionId": session_id,
            "letter": letter,
            "isCorrect": is_correct,
            "maskedWord": session["word"] if is_loss else masked,
            "revealedWord": session["word"] if is_game_over else None,
            "guessedLetters": list(session["guessed_letters"]),
            "mistakes": session["mistakes"],
            "maxMistakes": MAX_MISTAKES,
            "isGameOver": is_game_over,
            "isWin": is_win,
            "scores": scores
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
