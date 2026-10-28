from flask_cors import CORS

from flask import (
    Flask,
    render_template,
    request,
    Response,
    session,
    stream_with_context,
    redirect,
    url_for,
)

from google import genai
from google.genai import types
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

import os
import sqlite3


# =========================================================
# CONFIGURATION
# =========================================================

load_dotenv()

app = Flask(__name__)

app.secret_key = os.getenv("FLASK_SECRET_KEY")

if not app.secret_key:
    raise RuntimeError("FLASK_SECRET_KEY is missing.")

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_SAMESITE="None",
)

CORS(
    app,
    origins=["https://mindhealth-snowy.vercel.app"],
    supports_credentials=True,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "mindhealth.db")


# =========================================================
# GEMINI SETUP
# =========================================================

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError(
        "GEMINI_API_KEY is missing. Add it to your environment variables."
    )

client = genai.Client(
    api_key=api_key,
    http_options=types.HttpOptions(
        retry_options=types.HttpRetryOptions(
            attempts=1,
        )
    ),
)


# =========================================================
# DATABASE
# =========================================================

def get_db_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def save_chat_message(user_id, message, sender):
    connection = get_db_connection()

    try:
        connection.execute(
            """
            INSERT INTO chat_history (user_id, message, sender)
            VALUES (?, ?, ?)
            """,
            (user_id, message, sender),
        )

        connection.commit()

    finally:
        connection.close()


def init_db():
    connection = get_db_connection()

    try:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                message TEXT NOT NULL,
                sender TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """
        )

        connection.commit()

    finally:
        connection.close()


# Initialize the database when the application starts.
# This also runs when Gunicorn imports the application on Render.
init_db()


# =========================================================
# MINDHEALTH AI INSTRUCTION
# =========================================================

MINDHEALTH_INSTRUCTION = """
You are MindHealth, a supportive mental-health conversation assistant.

Your purpose is to provide a safe, calm, empathetic space for users
to talk about their feelings, stress, worries, loneliness, studies,
relationships, work, or everyday difficulties.

IMPORTANT RULES:

1. Be warm, natural, and conversational.
2. Do not sound robotic or like a scripted chatbot.
3. Do not diagnose mental-health conditions.
4. Do not claim to be a doctor, therapist, or emergency service.
5. Do not repeatedly ask the same question.
6. Ask at most one meaningful follow-up question when appropriate.
7. If the user changes the topic, follow the new topic naturally.
8. Remember the context of the current conversation.
9. Do not unnecessarily repeat information the user already gave.
10. Keep responses reasonably concise unless the user asks for detail.
11. Validate the user's feelings without exaggerating them.
12. Do not judge the user.
13. Give practical suggestions when they would genuinely help.
14. If the user simply wants to talk, don't immediately give a list of advice.

SAFETY:

If the user expresses thoughts of suicide, self-harm, or immediate danger,
respond calmly and encourage them to contact emergency services,
a trusted person, or a qualified mental-health professional.

Do not provide instructions for self-harm or suicide.

If the user expresses an intention to harm another person,
encourage immediate distance from the situation and contact emergency
services or a trusted person.

The goal is to support the user, not replace professional care.
"""


# =========================================================
# SAFETY RESPONSES
# =========================================================

SAFETY_RESPONSE = """
I'm really sorry you're going through something this intense.

If you feel you might hurt yourself or you're in immediate danger,
please don't stay alone with this right now. Contact someone you trust
and stay with them if possible.

In India, you can call emergency services at 112 or Tele-MANAS at 14416.

You deserve immediate support from a real person who can stay with you
through this.
"""


MODERATE_SAFETY_RESPONSE = """
It sounds like things may be feeling especially difficult right now.

Please consider reaching out to someone you trust and telling them
what you're going through. You don't have to handle everything alone.

If you feel that you may be in immediate danger, contact emergency
services or a qualified mental-health professional.
"""


HARM_TO_OTHERS_RESPONSE = """
It sounds like you're dealing with some very intense feelings.

Please create some distance from the person or situation involved
and avoid acting on the impulse right now. If you think someone may
be in immediate danger, contact emergency services or someone you
trust who can stay with you.
"""


# =========================================================
# SAFETY DETECTION
# =========================================================

def detect_safety_risk(message):
    text = message.lower().strip()

    high_risk_phrases = [
        "kill myself",
        "killing myself",
        "suicide",
        "suicidal",
        "end my life",
        "take my own life",
        "want to die",
        "i want to die",
        "i will die",
        "going to kill myself",
        "hurt myself",
        "harm myself",
        "self harm",
        "self-harm",
    ]

    moderate_phrases = [
        "can't go on",
        "cannot go on",
        "no reason to live",
        "don't want to live",
        "dont want to live",
        "life isn't worth living",
        "life is not worth living",
    ]

    indirect_phrases = [
        "better off dead",
        "wish i wasn't here",
        "wish i were dead",
        "everyone would be better without me",
        "nobody would miss me",
    ]

    harm_to_others_phrases = [
        "kill someone",
        "kill him",
        "kill her",
        "hurt someone",
        "harm someone",
        "attack someone",
        "want to hurt him",
        "want to hurt her",
    ]

    if any(
        phrase in text
        for phrase in harm_to_others_phrases
    ):
        return "HARM_TO_OTHERS"

    high_score = sum(
        5
        for phrase in high_risk_phrases
        if phrase in text
    )

    moderate_score = sum(
        3
        for phrase in moderate_phrases
        if phrase in text
    )

    indirect_score = sum(
        1
        for phrase in indirect_phrases
        if phrase in text
    )

    total_score = (
        high_score
        + moderate_score
        + indirect_score
    )

    if total_score >= 5:
        return "HIGH"

    if total_score >= 3:
        return "MODERATE"

    return "LOW"


# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():
    if "user_id" in session:
        return redirect(url_for("chat_page"))

    return render_template("index.html")


# =========================================================
# SIGNUP
# =========================================================

@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True)

    if not data:
        return Response(
            "No data received.",
            status=400,
            mimetype="text/plain",
        )

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    confirm_password = data.get("confirm", "")

    if not name or not email or not password:
        return Response(
            "Please fill in all required fields.",
            status=400,
            mimetype="text/plain",
        )

    if password != confirm_password:
        return Response(
            "Passwords do not match.",
            status=400,
            mimetype="text/plain",
        )

    if len(password) < 8:
        return Response(
            "Password must be at least 8 characters.",
            status=400,
            mimetype="text/plain",
        )

    connection = get_db_connection()

    try:
        hashed_password = generate_password_hash(password)

        cursor = connection.execute(
            """
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
            """,
            (name, email, hashed_password),
        )

        connection.commit()

        user_id = cursor.lastrowid

        session.clear()
        session["user_id"] = user_id
        session["user_name"] = name

        return Response(
            "Signup successful.",
            status=201,
            mimetype="text/plain",
        )

    except sqlite3.IntegrityError:
        return Response(
            "An account with this email already exists.",
            status=409,
            mimetype="text/plain",
        )

    finally:
        connection.close()


# =========================================================
# LOGIN
# =========================================================

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)

    if not data:
        return Response(
            "No data received.",
            status=400,
            mimetype="text/plain",
        )

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return Response(
            "Please enter your email and password.",
            status=400,
            mimetype="text/plain",
        )

    connection = get_db_connection()

    try:
        user = connection.execute(
            """
            SELECT id, name, email, password
            FROM users
            WHERE email = ?
            """,
            (email,),
        ).fetchone()

    finally:
        connection.close()

    if user is None:
        return Response(
            "Invalid email or password.",
            status=401,
            mimetype="text/plain",
        )

    if not check_password_hash(
        user["password"],
        password,
    ):
        return Response(
            "Invalid email or password.",
            status=401,
            mimetype="text/plain",
        )

    session.clear()
    session["user_id"] = user["id"]
    session["user_name"] = user["name"]

    return Response(
        "Login successful.",
        status=200,
        mimetype="text/plain",
    )


# =========================================================
# SESSION MANAGEMENT
# =========================================================

@app.route("/session", methods=["GET"])
def check_session():
    if "user_id" in session:
        return {
            "loggedIn": True,
            "userName": session.get("user_name"),
        }, 200

    return {
        "loggedIn": False,
    }, 200


# =========================================================
# CHAT HISTORY
# =========================================================

@app.route("/chat-history", methods=["GET"])
def chat_history():
    if "user_id" not in session:
        return {
            "error": "Please log in first."
        }, 401

    connection = get_db_connection()

    try:
        rows = connection.execute(
            """
            SELECT id, message, sender, created_at
            FROM chat_history
            WHERE user_id = ?
            ORDER BY id ASC
            """,
            (session["user_id"],),
        ).fetchall()

    finally:
        connection.close()

    return {
        "messages": [
            {
                "id": row["id"],
                "text": row["message"],
                "sender": row["sender"],
                "time": row["created_at"],
            }
            for row in rows
        ]
    }, 200


# =========================================================
# LOGOUT
# =========================================================

@app.route("/logout", methods=["POST", "GET"])
def logout():
    session.clear()

    return {
        "message": "Logged out successfully."
    }, 200


# =========================================================
# CHAT PAGE
# =========================================================

@app.route("/chat-page")
def chat_page():
    if "user_id" not in session:
        return redirect(url_for("home"))

    return render_template(
        "chat.html",
        user_name=session.get("user_name", "User"),
    )


# =========================================================
# CHAT API
# =========================================================

@app.route("/chat", methods=["POST"])
def chat():
    if "user_id" not in session:
        return Response(
            "Please log in first.",
            status=401,
            mimetype="text/plain",
        )

    data = request.get_json(silent=True)

    if not data:
        return Response(
            "No data received.",
            status=400,
            mimetype="text/plain",
        )

    user_message = data.get("message", "").strip()

    if not user_message:
        return Response(
            "Please enter a message.",
            status=400,
            mimetype="text/plain",
        )

    user_id = session["user_id"]

    save_chat_message(
        user_id,
        user_message,
        "user",
    )

    risk_level = detect_safety_risk(user_message)

    if risk_level == "HIGH":
        save_chat_message(
            user_id,
            SAFETY_RESPONSE,
            "bot",
        )

        return Response(
            SAFETY_RESPONSE,
            status=200,
            mimetype="text/plain",
        )

    if risk_level == "MODERATE":
        save_chat_message(
            user_id,
            MODERATE_SAFETY_RESPONSE,
            "bot",
        )

        return Response(
            MODERATE_SAFETY_RESPONSE,
            status=200,
            mimetype="text/plain",
        )

    if risk_level == "HARM_TO_OTHERS":
        save_chat_message(
            user_id,
            HARM_TO_OTHERS_RESPONSE,
            "bot",
        )

        return Response(
            HARM_TO_OTHERS_RESPONSE,
            status=200,
            mimetype="text/plain",
        )

    previous_interaction_id = session.get(
        "previous_interaction_id"
    )

    def generate(message, previous_id):
        new_interaction_id = previous_id
        bot_text = ""

        try:
            stream = client.interactions.create(
                model="gemini-3.6-flash",
                input=message,
                system_instruction=MINDHEALTH_INSTRUCTION,
                previous_interaction_id=previous_id,
                stream=True,
            )

            for event in stream:
                if event.event_type == "interaction.completed":
                    new_interaction_id = event.interaction.id

                elif event.event_type == "step.delta":
                    if event.delta.type == "text":
                        text = event.delta.text

                        if text:
                            bot_text += text
                            yield text

                elif event.event_type == "error":
                    print(
                        "GEMINI API ERROR:",
                        event.error.message,
                    )

                    bot_text = (
                        "I'm unable to respond right now because "
                        "the AI service has temporarily reached its "
                        "usage limit. Please try again in a little while."
                    )

                    yield bot_text
                    break

            if bot_text:
                save_chat_message(
                    user_id,
                    bot_text,
                    "bot",
                )

        except Exception as error:
            print("Gemini Error:", error)

            bot_text = (
                "I'm having a little trouble responding right now. "
                "Please try sending your message again."
            )

            save_chat_message(
                user_id,
                bot_text,
                "bot",
            )

            yield bot_text

        finally:
            # Flask's default session is cookie-based.
            # Updating it after streaming starts may not persist.
            # See the deployment note below.
            session["previous_interaction_id"] = new_interaction_id

    return Response(
        stream_with_context(
            generate(
                user_message,
                previous_interaction_id,
            )
        ),
        mimetype="text/plain",
    )


# =========================================================
# START APPLICATION
# =========================================================

if __name__ == "__main__":
    app.run(debug=True)