# 🛡️ CyberVerse — AI-Powered Cybersecurity Simulator

CyberVerse is an interactive, AI-powered cybersecurity platform built to help users identify potential digital threats, analyze suspicious messages and URLs, and improve their cybersecurity awareness.

It combines AI-based analysis, rule-based threat detection, security analytics, and interactive learning tools in a modern web dashboard.

---

## 🚀 Features

### 🔍 AI Phishing Message Analyzer
- Analyze suspicious messages using AI-powered analysis.
- Detect phishing indicators and social engineering techniques.
- Generate security risk scores from 0–100.
- Classify messages into High, Medium, and Low risk levels.
- Includes rule-based fallback analysis.

### 🌐 URL Security Scanner
- Analyze potentially suspicious URLs.
- Detect insecure HTTP connections.
- Identify suspicious domain keywords and URL paths.
- Generate URL risk scores and security warnings.
- Provide recommendations for safer browsing.

### 📡 Interactive Threat Radar
- Visualize security activity and threat levels.
- Display High, Medium, and Low risk indicators.
- Monitor recent security scan activity.

### 📊 Security Analytics Dashboard
- View security statistics and scan activity.
- Monitor detected threats.
- Track security scores.
- Explore scan history.
- Export security data.

### 👤 User Authentication & Profile Management
- Secure Login and Signup functionality.
- Individual user profiles.
- Edit username and email information.
- View account details and account creation information.
- Logout and session management.

### 📄 Security Report Generation
- Generate downloadable PDF security reports.
- View security statistics and scan summaries.

### 🔔 Notification System
- Security-related notifications.
- Notification preference management.
- Notifications for relevant security activities.

### 🎓 Cyber Academy
- Interactive cybersecurity quizzes.
- AI-generated knowledge checks.
- Learn about phishing, password security, online threats, and safe browsing.

### 🎨 Modern User Interface
- Interactive cybersecurity dashboard.
- Dark Mode and Light Mode.
- Responsive interface.
- Modern visual design and security-focused components.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Python, Flask |
| AI Integration | Groq API, Large Language Models |
| Threat Detection | AI Analysis, Rule-Based Detection |
| Database | SQLite |
| Reporting | PDF Generation |
| Version Control | Git, GitHub |

---

## 📂 Project Structure

```text
CyberVerse/
│
├── app.py
├── requirements.txt
├── .gitignore
│
├── templates/
│   ├── index.html
│   └── profile.html
│
└── static/
    ├── style.css
    └── script.js
```

*Additional files may be present depending on the project configuration.*

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/prakritinagar01-hub/CyberVerse.git
cd CyberVerse
```

### 2. Create a Virtual Environment

```bash
python -m venv .venv
```

### 3. Activate the Environment

**Windows:**

```bash
.venv\Scripts\activate
```

**Linux / macOS:**

```bash
source .venv/bin/activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Configure Environment Variables

Create a `.env` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key
```

Replace the placeholder with your own API key.

**Important:** Never upload your `.env` file, API keys, passwords, or other sensitive credentials to GitHub.

### 6. Run the Application

```bash
python app.py
```

Open your browser and visit:

```text
http://127.0.0.1:5000
```

---

## 🔐 Security Disclaimer

CyberVerse is an educational cybersecurity analysis platform.

- Risk scores are indicative and based on available analysis techniques.
- URL scanning does not guarantee detection of all malicious websites.
- AI-generated results may contain inaccuracies.
- A low-risk result does not guarantee that a message or website is safe.
- Always verify suspicious requests through official channels.

CyberVerse should not replace professional security tools, antivirus software, or independent security verification.

---

## 👩‍💻 Author

**Prakriti Nagar**

- GitHub: [prakritinagar01-hub](https://github.com/prakritinagar01-hub)

---

## ⭐ Support

If you find CyberVerse interesting or useful, consider giving the repository a ⭐ on GitHub!

**Built with Python, Flask, JavaScript, and a passion for cybersecurity.**