
# 🛡️ CyberVerse — Interactive Cybersecurity Learning Platform

CyberVerse is an interactive cybersecurity learning platform designed to help users understand online threats through practical security labs, phishing-message analysis, password-strength testing, quizzes, and simulated threat monitoring.

The project combines a modern web interface with a Python Flask backend to make cybersecurity concepts easier to explore.

## ✨ Features

### 🔍 Phishing Message Analyzer
- Analyze suspicious messages for common phishing indicators.
- Assign a risk score from 0 to 100.
- Categorize results as Low, Medium, or High risk.
- Display warning signs and security advice.
- Flask API endpoint for message analysis.

### 🔗 Phishing URL Checker
- Dedicated interface for checking suspicious URLs.
- Designed for future integration with additional URL-analysis capabilities.

### 🔐 Password Security Lab
- Evaluate password-strength indicators.
- Display password improvement tips.
- Encourage unique passwords and stronger authentication practices.

### 📡 Threat Radar Dashboard
- Interactive simulated threat radar.
- Display simulated threat signals.
- Activity feed for recent demo scans.

### 📊 Security Score Meter
- Interactive security-score visualization.
- Demonstration score and status indicators.

### 🧠 Cybersecurity Quiz
- Multiple-choice cybersecurity questions.
- Instant feedback and explanations.
- XP rewards for correct answers.

### 💻 Interactive Terminal
- Practice basic security concepts through simulated commands.
- Includes help, status, tips, and sample scan commands.
- Does not perform real network scans.

### 🏆 Gamification
- XP points, levels, achievements, and progress tracking.
- Saves learning progress using browser LocalStorage.

## 🛠️ Tech Stack

**Frontend**
- HTML5
- CSS3
- JavaScript

**Backend**
- Python
- Flask
- Flask JSON API

**Planned Extensions**
- Local AI integration using Ollama
- SQLite database
- Secure user registration and login
- Persistent scan history

## 📁 Project Structure

```text
CyberVerse/
│
├── index.html
├── style.css
├── script.js
├── app.py
├── README.md
├── .gitignore
└── .venv/
```

The `.venv/` directory is a local virtual environment and should not be uploaded to GitHub.

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/prakritinagar01-hub/CyberVerse.git
cd CyberVerse
```

### 2. Create a virtual environment

```bash
python -m venv .venv
```

### 3. Activate the environment

**Windows PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

### 4. Install dependencies

```bash
python -m pip install Flask
```

Additional dependencies may be required as new features are implemented.

### 5. Run the application

```bash
python app.py
```

### 6. Open in your browser

Visit:

http://127.0.0.1:5000

## 🔌 API Endpoint

### Analyze a message

**Endpoint:** `/api/analyze`

**Method:** `POST`

**Request body:**

```json
{
  "message": "URGENT: Verify your account immediately."
}
```

The endpoint returns a JSON response containing a risk score, risk category, warning messages, and security advice.

## 🔒 Security and Privacy

- Never commit API keys, passwords, or other secrets to GitHub.
- Keep local configuration files such as `.env` out of version control.
- Use password hashing when implementing account registration.
- Validate and limit user input on the server.
- Do not enter real passwords, OTPs, or confidential messages into the demo.

## ⚠️ Disclaimer

CyberVerse is an educational cybersecurity project.

The current message analyzer uses keyword-based heuristics. It is not a production-grade phishing detector, antivirus, or threat intelligence platform. The threat radar and security score are simulated demonstrations.

A low risk score does not guarantee that a message or URL is safe. Always verify suspicious communications through trusted official channels.

## 🔮 Future Enhancements

- Local AI-powered phishing analysis using Ollama
- Improved suspicious URL analysis
- Secure login and registration
- SQLite-backed user accounts and scan history
- Personalized security recommendations
- More cybersecurity labs and quizzes
- Improved accessibility and mobile responsiveness

## 👩‍💻 Author

**Prakriti Nagar**

- GitHub: [@prakritinagar01-hub](https://github.com/prakritinagar01-hub)

---

Built to make cybersecurity learning interactive, practical, and accessible. 🛡️

