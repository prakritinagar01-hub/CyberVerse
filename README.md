# 🛡️ CyberVerse – AI-Powered Cybersecurity Learning Platform

<p align="center">
  <strong>Think Before You Click. Stay Ahead of Cyber Threats.</strong>
</p>

<p align="center">
  An interactive cybersecurity platform that helps users identify potential phishing messages, analyze suspicious URLs, improve password security, and learn cybersecurity through AI-powered tools.
</p>

---

## 🚀 Overview

**CyberVerse** is a full-stack cybersecurity web application developed using Python, Flask, HTML, CSS, and JavaScript.

The platform combines AI-assisted message analysis, rule-based threat detection, interactive security tools, data visualization, and gamified learning to create an engaging cybersecurity experience.

It helps users understand potential online threats and develop safer digital habits through practical simulations and security analysis.

## ✨ Features

### 1. 🤖 AI-Powered Phishing Message Scanner
- Analyze suspicious messages and text.
- Uses a locally hosted Ollama language model for AI-assisted analysis.
- Combines AI analysis with Python-based rule detection.
- Generates a risk score out of 100.
- Classifies potential threats as Low, Medium, or High.
- Displays suspicious indicators and analysis results.

### 2. 🌐 URL Security Scanner
- Analyze suspicious website URLs.
- Identify potentially unsafe URL patterns.
- Evaluate suspicious domains and URL structures.
- Generate heuristic-based risk assessments.

> Note: URL analysis is heuristic-based. It does not independently verify live malware status or website reputation.

### 3. 🔐 Password Strength Checker
- Test password strength.
- Identify basic password weaknesses.
- Provide interactive password security feedback.

### 4. 🎓 Cyber Academy
- Interactive cybersecurity quizzes.
- AI-generated questions using Ollama.
- Multiple-choice answer checking.
- Quiz progress tracking.
- Learn about phishing, passwords, and online security.

### 5. 📡 Threat Radar
- Animated threat visualization.
- Displays indicators based on stored scan history.
- Provides an interactive cybersecurity dashboard experience.

> Note: Threat Radar is a visual simulation based on local scan records, not a real-time global threat monitoring system.

### 6. 📊 Security Analytics Dashboard
- Total security scans.
- High, Medium, and Low risk statistics.
- Security score estimation.
- Interactive charts using Chart.js.
- Risk distribution and scan analytics.

### 7. 📁 Scan History & CSV Export
- Store message and URL scan records using SQLite.
- View previous scan results.
- Review risk scores and timestamps.
- Export scan history as CSV.
- Delete stored scan history.

### 8. ⚡ Gamification System
- Earn XP points.
- Progress through levels.
- Unlock achievements.
- Track quiz performance.
- Monitor learning activity.

### 9. 📡 Live Activity Feed
- Display recent security scans.
- Show scan types and risk levels.
- Display timestamps and scan scores.
- Automatically refresh activity after new scans.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Python | Backend programming |
| Flask | Backend framework and REST APIs |
| HTML5 | Web structure |
| CSS3 | Responsive UI and animations |
| JavaScript | Frontend interactions |
| SQLite | Scan history storage |
| Ollama | Local LLM integration |
| Qwen 2.5 (1.5B) | Local AI model |
| Chart.js | Analytics visualizations |
| Git & GitHub | Version control |

---

## 🏗️ Project Architecture

```text
CyberVerse/
│
├── app.py
│
├── app_secureai_lab.py
│
├── requirements.txt
│
├── cyberverse.db
│
├── templates/
│   └── index.html
│
├── static/
│   ├── style.css
│   └── script.js
│
├── .gitignore
│
└── README.md
```

**Architecture workflow:**

```text
User
  |
  v
HTML / CSS / JavaScript
  |
  v
Flask Backend
  |
  +----------------------+
  |                      |
  v                      v
Ollama AI           Python Rule Engine
  |                      |
  +-----------+----------+
              |
              v
       Risk Analysis
              |
              v
        SQLite Database
              |
              v
    Dashboard & Analytics
```

---

## ⚙️ Installation & Setup

### Prerequisites

Install the following:

- Python 3.10 or later
- Git
- Ollama
- A compatible local AI model

### Step 1: Clone the Repository

```bash
git clone https://github.com/prakritinagar01-hub/CyberVerse.git
```

### Step 2: Navigate to the Project

```bash
cd CyberVerse
```

### Step 3: Create a Virtual Environment

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\Activate
```

### Step 4: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 5: Install and Configure Ollama

Download Ollama from:

https://ollama.com/

Pull the required model:

```bash
ollama pull qwen2.5:1.5b
```

Ensure Ollama is running locally before using AI-powered features.

### Step 6: Run CyberVerse

```bash
python app.py
```

Open your browser:

```text
http://127.0.0.1:5000
```

---

## 🔌 API Endpoints

The application uses Flask APIs for communication between the frontend and backend.

| Endpoint | Method | Purpose |
|---|---|---|
| `/` | GET | Load main dashboard |
| `/api/analyze` | POST | Analyze suspicious messages |
| `/api/scan-url` | POST | Analyze website URLs |
| `/api/history` | GET | Retrieve message scan history |
| `/api/url-history` | GET | Retrieve URL scan history |
| `/api/recent-activity` | GET | Retrieve recent scan activity |

Additional quiz, analytics, export, and history-management routes are implemented in the backend.

---

## 🧠 AI & Detection Approach

CyberVerse uses a hybrid analysis approach for phishing message detection.

**AI-assisted analysis:**
- Uses a locally hosted Ollama model.
- Helps interpret suspicious messages.
- Generates contextual analysis.

**Rule-based analysis:**
- Detects urgent language.
- Identifies password and OTP-related requests.
- Checks suspicious links and verification requests.
- Identifies prize and reward-related patterns.

The combined system produces a risk assessment to help users recognize potentially dangerous messages.

> Risk scores are heuristic assessments, not calibrated probabilities or guaranteed malware/phishing detection results.

---

## 🔒 Security & Limitations

- AI features require a running Ollama service in the local setup.
- The URL scanner uses heuristic checks rather than live reputation databases.
- The Threat Radar visualizes stored scan records.
- The security score is an estimate derived from scan history.
- SQLite is used for local scan-history storage.
- Do not enter real passwords, OTPs, or confidential information into the demonstration tools.

---

## ☁️ Deployment

CyberVerse can be deployed as a Flask web application using platforms such as Render.

For deployment, configure:

**Build Command**
```bash
pip install -r requirements.txt
```

**Start Command**
```bash
gunicorn app:app
```

### Important Deployment Note

Ollama running on your local computer is not automatically available to a cloud-hosted application.

To enable AI-powered features in production, configure a separately hosted AI inference service or another accessible model API.

SQLite storage on a typical cloud web-service filesystem may not persist across restarts or redeployments. Use persistent storage or a managed database if permanent history is required.

---

## 🎯 Future Improvements

- Live malicious URL reputation checking.
- Integration with threat intelligence APIs.
- Cloud-hosted AI inference.
- User authentication and role-based access.
- Persistent cloud database.
- Advanced phishing detection models.
- More cybersecurity learning modules.
- Detailed security reports and downloadable PDFs.

---

## 👩‍💻 Author

**Prakriti Nagar**

B.Tech – Mathematics & Computing

Shri Mata Vaishno Devi University

- GitHub: https://github.com/prakritinagar01-hub
- LinkedIn: https://linkedin.com/in/prakriti-nagar-237546326

---

## ⭐ Support

If you find CyberVerse interesting, consider giving the repository a ⭐ on GitHub!

**CyberVerse – Think Before You Click. Stay Cyber Safe.**