
from flask import Flask, request, jsonify, send_from_directory
import re

app = Flask(__name__)


def analyse_message(message):
    text = message.lower()
    score = 0
    warnings = []

    # Urgent language
    if re.search(r"\b(urgent|immediately|act now|account suspended)\b", text):
        score += 20
        warnings.append("Urgent or threatening language detected.")

    # Password and OTP requests
    if re.search(r"\b(password|otp|pin|cvv)\b", text):
        score += 25
        warnings.append("Sensitive information may be requested.")

    # Suspicious links or verification requests
    if re.search(r"\b(click here|verify account|login now|reset password)\b", text):
        score += 25
        warnings.append("Suspicious link or account-verification language detected.")

    # Prize or reward scams
    if re.search(r"\b(won a prize|claim reward|free gift|lottery winner)\b", text):
        score += 25
        warnings.append("Possible prize or reward scam language detected.")

    score = min(score, 100)

    if score >= 50:
        risk = "High"
    elif score >= 25:
        risk = "Medium"
    else:
        risk = "Low"

    if not warnings:
        warnings.append("No common phishing keywords were detected.")

    return {
        "score": score,
        "risk": risk,
        "warnings": warnings,
        "advice": (
            "Do not click suspicious links or share sensitive information. "
            "Verify the sender through an official channel."
        )
    }


@app.route("/")
def home():
    return send_from_directory(".", "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(".", filename)


@app.route("/api/analyze", methods=["POST"])
def analyze():
    data = request.get_json(silent=True) or {}
    message = data.get("message", "")

    if not isinstance(message, str) or not message.strip():
        return jsonify({"error": "Please enter a message to analyze."}), 400

    if len(message) > 5000:
        return jsonify({"error": "Message must be 5000 characters or fewer."}), 400

    result = analyse_message(message)
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)
