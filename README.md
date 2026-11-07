# 🛡️ CyberVerse — AI-Powered Cybersecurity Simulator

CyberVerse is an interactive cybersecurity platform designed to help users identify digital threats, analyze suspicious messages and URLs, and improve their cybersecurity awareness through AI-powered analysis and interactive learning.

## 🚀 Features

### 🔍 AI Phishing Message Analyzer
- Analyze suspicious messages.
- Identify potential phishing indicators.
- Generate risk scores and threat classifications.
- AI-powered analysis with rule-based fallback.

### 🌐 URL Security Scanner
- Scan suspicious URLs.
- Detect potentially unsafe URL patterns.
- Identify suspicious domains and URL characteristics.
- Classify URLs based on risk levels.

### 📡 Interactive Threat Radar
- Visualize High, Medium, and Low risk activity.
- Dynamic radar indicators.
- Analyze recent security scan records.

### 📊 Security Analytics Dashboard
- Security risk statistics.
- Scan history and recent activity.
- Security score monitoring.
- CSV export functionality.

### 🎓 Cyber Academy
- Interactive cybersecurity quizzes.
- AI-generated knowledge checks.
- Learn about phishing, password security, online threats, and safe browsing.

## 🛠️ Tech Stack

**Frontend**
- HTML5
- CSS3
- JavaScript

**Backend**
- Python
- Flask
- REST APIs

**AI Integration**
- Groq API
- Large Language Models
- Rule-Based Threat Detection

**Database & Tools**
- SQLite
- Git & GitHub
- Render

## 📂 Project Structure

```text
CyberVerse/
│
├── app.py
├── requirements.txt
├── .gitignore
│
├── templates/
│   └── index.html
│
└── static/
    ├── style.css
    └── script.js
```

## ⚙️ Installation & Setup

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

**Windows:**
```bash
.venv\Scripts\activate
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Configure environment variables

Create a `.env` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key
```

Never upload your API key or `.env` file to GitHub.

### 6. Run the application

```bash
python app.py
```

Open your browser and visit:

```text
http://127.0.0.1:5000
```

## ☁️ Deployment

CyberVerse can be deployed using Render.

- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn app:app`
- Add `GROQ_API_KEY` in Render Environment Variables.

## 🔐 Security Note

CyberVerse is an educational cybersecurity analysis tool. Its risk classifications are indicative and should not replace professional security tools or manual verification.

## 👩‍💻 Author

**Prakriti Nagar**

- GitHub: [prakritinagar01-hub](https://github.com/prakritinagar01-hub)

---

⭐ If you find CyberVerse interesting, consider starring the repository!