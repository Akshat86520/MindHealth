# MindHealth 🧠

MindHealth is an AI-powered mental health support assistant designed to provide users with a safe and supportive space to express their feelings.

The application uses a React frontend, Flask backend, Google Gemini API for conversational responses, and SQLite for user accounts and chat history.

---

## ✨ Features

- 🔐 User registration and login
- 💬 AI-powered mental health conversations
- 🧠 Gemini-based conversational responses
- 🛡️ Safety detection for potentially harmful messages
- 💾 Persistent chat history
- 🔄 Conversation context using Gemini interactions
- ⚡ Real-time streaming AI responses
- 📱 Responsive and user-friendly interface
- 🚪 Session-based authentication
- 🗄️ SQLite database for users and conversations

---

## 🛠️ Tech Stack

### Frontend

- React
- JavaScript
- HTML
- CSS
- Vite

### Backend

- Python
- Flask
- SQLite

### AI

- Google Gemini API

---

## 🏗️ Project Architecture

```text
User
  ↓
React Frontend
  ↓
Flask Backend
  ├──→ Safety Detection
  │
  ├──→ Google Gemini API
  │       ↓
  │   Streaming Response
  │
  ├──→ React Frontend
  │
  └──→ SQLite Database
          ├── Users
          └── Chat History
