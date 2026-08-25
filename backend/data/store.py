import datetime

class ArcadeStore:
    def __init__(self):
        self.scores = {
            "ttt": {
                "playerWins": 0,
                "botWins": 0,
                "draws": 0,
                "streak": 0,
                "rounds": 0
            },
            "rps": {
                "playerWins": 0,
                "botWins": 0,
                "ties": 0,
                "currentStreak": 0,
                "bestStreak": 0,
                "history": [],
                "seriesMode": "best3", # best3, best5, endless
                "seriesPlayerWins": 0,
                "seriesBotWins": 0,
                "seriesTies": 0,
                "seriesMatchCount": 0
            },
            "hangman": {
                "wins": 0,
                "losses": 0,
                "perfectWins": 0,
                "currentStreak": 0,
                "wordsSolved": []
            }
        }
        self.active_hangman_sessions = {}

    def get_scores(self):
        return self.scores

    def update_ttt_score(self, result):
        self.scores["ttt"]["rounds"] += 1
        if result == "player":
            self.scores["ttt"]["playerWins"] += 1
            self.scores["ttt"]["streak"] += 1
        elif result == "bot":
            self.scores["ttt"]["botWins"] += 1
            self.scores["ttt"]["streak"] = 0
        else:
            self.scores["ttt"]["draws"] += 1
        return self.scores["ttt"]

    def update_rps_score(self, result, player_move, bot_move, mode="best3"):
        self.scores["rps"]["seriesMode"] = mode
        if result == "win":
            self.scores["rps"]["playerWins"] += 1
            self.scores["rps"]["seriesPlayerWins"] += 1
            self.scores["rps"]["currentStreak"] += 1
            if self.scores["rps"]["currentStreak"] > self.scores["rps"]["bestStreak"]:
                self.scores["rps"]["bestStreak"] = self.scores["rps"]["currentStreak"]
        elif result == "lose":
            self.scores["rps"]["botWins"] += 1
            self.scores["rps"]["seriesBotWins"] += 1
            self.scores["rps"]["currentStreak"] = 0
        else:
            self.scores["rps"]["ties"] += 1
            self.scores["rps"]["seriesTies"] += 1

        self.scores["rps"]["seriesMatchCount"] += 1

        self.scores["rps"]["history"].insert(0, {
            "id": int(datetime.datetime.now().timestamp() * 1000),
            "playerMove": player_move,
            "botMove": bot_move,
            "result": result,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        })

        if len(self.scores["rps"]["history"]) > 20:
            self.scores["rps"]["history"].pop()

        return self.scores["rps"]

    def reset_rps_series(self, mode=None):
        if mode:
            self.scores["rps"]["seriesMode"] = mode
        self.scores["rps"]["seriesPlayerWins"] = 0
        self.scores["rps"]["seriesBotWins"] = 0
        self.scores["rps"]["seriesTies"] = 0
        self.scores["rps"]["seriesMatchCount"] = 0
        return self.scores["rps"]

    def update_hangman_score(self, won, mistakes, word):
        if won:
            self.scores["hangman"]["wins"] += 1
            self.scores["hangman"]["currentStreak"] += 1
            if mistakes == 0:
                self.scores["hangman"]["perfectWins"] += 1
            if word not in self.scores["hangman"]["wordsSolved"]:
                self.scores["hangman"]["wordsSolved"].append(word)
        else:
            self.scores["hangman"]["losses"] += 1
            self.scores["hangman"]["currentStreak"] = 0
        return self.scores["hangman"]

    def reset_game_scores(self, game):
        if game == "ttt":
            self.scores["ttt"] = {
                "playerWins": 0, "botWins": 0, "draws": 0, "streak": 0, "rounds": 0
            }
        elif game == "rps":
            self.scores["rps"] = {
                "playerWins": 0, "botWins": 0, "ties": 0, "currentStreak": 0,
                "bestStreak": self.scores["rps"]["bestStreak"], "history": [],
                "seriesMode": self.scores["rps"].get("seriesMode", "best3"),
                "seriesPlayerWins": 0, "seriesBotWins": 0, "seriesTies": 0, "seriesMatchCount": 0
            }
        elif game == "hangman":
            self.scores["hangman"] = {
                "wins": 0, "losses": 0, "perfectWins": 0, "currentStreak": 0, "wordsSolved": []
            }
        return self.scores

arcade_store = ArcadeStore()
