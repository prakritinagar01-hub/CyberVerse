
"use strict";

// ==========================================
// CYBERVERSE - COMPLETE MAIN JAVASCRIPT
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // ======================================
    // 1. HELPERS & APP STATE
    // ======================================

    const $ = (selector) => document.querySelector(selector);

        // =====================================
    // THEME MANAGEMENT
    // =====================================

    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");

    function applyTheme(theme) {
        document.documentElement.dataset.theme = theme;

        if (themeIcon) {
            themeIcon.textContent = theme === "dark" ? "☀" : "☾";
        }

        if (themeToggle) {
            const nextTheme = theme === "dark" ? "light" : "dark";

            themeToggle.setAttribute(
                "aria-label",
                `Switch to ${nextTheme} mode`
            );

            themeToggle.title = `Switch to ${nextTheme} mode`;
        }

        localStorage.setItem("cyberverseTheme", theme);
    }

    const savedTheme = localStorage.getItem("cyberverseTheme");
    applyTheme(savedTheme === "light" ? "light" : "dark");

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const currentTheme = document.documentElement.dataset.theme;
            const nextTheme = currentTheme === "dark" ? "light" : "dark";

            applyTheme(nextTheme);
        });
    }

    const state = {
        xp: Number(localStorage.getItem("cyberverseXP")) || 0,
        completed: Number(localStorage.getItem("cyberverseCompleted")) || 0,
        messages: Number(localStorage.getItem("cyberverseMessages")) || 0,
        quizCorrect: JSON.parse(localStorage.getItem("cyberverseQuizCorrect") || "[]"),
        activity: []
    };

    let riskChart = null;
    let activityChart = null;
    let currentHistory = [];

    function saveState() {
        localStorage.setItem("cyberverseXP", state.xp);
        localStorage.setItem("cyberverseCompleted", state.completed);
        localStorage.setItem("cyberverseMessages", state.messages);
        localStorage.setItem(
            "cyberverseQuizCorrect",
            JSON.stringify(state.quizCorrect)
        );
    }

    async function api(url, options = {}) {
        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            },
            ...options
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || "Something went wrong.");
        }

        return data;
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[char]);
    }

    function showToast(message) {
        let toast = $("#cyberToast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "cyberToast";
            toast.style.cssText = `
                position:fixed;
                bottom:25px;
                right:25px;
                z-index:99999;
                padding:14px 20px;
                border-radius:10px;
                background:#171b35;
                color:white;
                border:1px solid #6555dc;
                box-shadow:0 5px 25px #0005;
                font-size:14px;
            `;
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.display = "block";

        clearTimeout(toast.timer);
        toast.timer = setTimeout(() => {
            toast.style.display = "none";
        }, 2800);
    }

    function addXP(amount, reason = "Activity completed") {
        state.xp += amount;
        state.completed++;
        saveState();
        updateProgress();
        showToast(`+${amount} XP — ${reason}`);
    }

    function addActivity(message, type = "info") {
        const feed = $("#activity-feed");
        const emptyMessage = feed?.querySelector(".activity-empty");
        if (emptyMessage) emptyMessage.remove();
        if (!feed) return;

        const item = document.createElement("div");
        item.className = "activity-item";

        const icon = document.createElement("span");
        icon.className = "activity-icon";
        icon.textContent =
            type === "danger" ? "⚠️" :
            type === "success" ? "✓" : "●";

        const content = document.createElement("span");
        content.textContent = message;

        item.append(icon, content);
        feed.prepend(item);

        while (feed.children.length > 8) {
            feed.lastElementChild.remove();
        }
    }

    // ======================================
    // 2. XP, LEVELS & ACHIEVEMENTS
    // ======================================

    function updateProgress() {
        const level = Math.floor(state.xp / 100) + 1;
        const progress = state.xp % 100;

        const values = {
            "#heroXP": state.xp,
            "#totalXP": state.xp,
            "#heroScans": state.messages,
            "#completed": state.completed,
            "#level": level,
            "#nextLevel": 100 - progress,
            "#progressLabel": `${progress}%`,
            "#badges": getBadgeCount()
        };

        Object.entries(values).forEach(([selector, value]) => {
            const element = $(selector);
            if (element) element.textContent = value;
        });

        const bar = $("#progressBar");
        if (bar) bar.style.width = `${progress}%`;

        const first = $("#badgeFirst");
        const analyst = $("#badgeAnalyst");
        const scholar = $("#badgeScholar");

        if (first) first.classList.toggle("unlocked", state.completed >= 1);
        if (analyst) analyst.classList.toggle("unlocked", state.messages >= 5);
        if (scholar) scholar.classList.toggle(
            "unlocked",
            state.quizCorrect.length >= 3
        );

        const hint = $("#badgeHint");
        if (hint) {
            hint.textContent =
                state.completed === 0
                    ? "Complete your first activity to unlock a badge."
                    : "Keep learning to unlock more achievements!";
        }
    }

    function getBadgeCount() {
        return [
            state.completed >= 1,
            state.messages >= 5,
            state.quizCorrect.length >= 3
        ].filter(Boolean).length;
    }

    // ======================================
    // 3. PHISHING MESSAGE SCANNER
    // ======================================

    const messageInput = $("#messageInput");
    const scanButton = $("#scanButton");
    const messageResult = $("#messageResult");
    const charCount = $("#charCount");

    if (messageInput && charCount) {
        messageInput.addEventListener("input", () => {
            charCount.textContent = messageInput.value.length;
        });
    }

    function renderMessageResult(data) {
        if (!messageResult) return;

        const score = Number(data.score) || 0;
        const risk = data.risk || "Unknown";
        const warnings = Array.isArray(data.warnings)
            ? data.warnings
            : [];

        const resultClass = risk.toLowerCase();

        messageResult.innerHTML = `
            <div class="result-card ${escapeHTML(resultClass)}">
                <h3>Security Risk: ${escapeHTML(risk)}</h3>
                <h2>${score}/100</h2>
                <p>${escapeHTML(data.explanation || "Analysis completed.")}</p>

                <div class="scanner-comparison">
    <p>🤖 AI Scanner Score:
        <strong>${Number(data.ai_score) || 0}/100</strong>
    </p>

    <p>🛡️ Rule-Based Scanner Score:
        <strong>${Number(data.rule_score) || 0}/100</strong>
    </p>

    <p>Scanner consistency estimate:
        <strong>${Number(data.confidence) || 0}%</strong>
    </p>
</div>

                <h4>Detected warnings</h4>
                <ul>
                    ${
                        warnings.length
                            ? warnings.map(item =>
                                `<li>${escapeHTML(item)}</li>`
                            ).join("")
                            : "<li>No specific warning returned.</li>"
                    }
                </ul>

                <h4>Recommended action</h4>
                <p>${escapeHTML(data.advice || "Stay cautious.")}</p>
            </div>
        `;

        messageResult.style.display = "block";
        messageResult.classList.remove("hidden");
    }

    async function scanMessage() {
        if (!messageInput || !messageResult) return;

        const message = messageInput.value.trim();

        if (!message) {
            showToast("Please enter a message first.");
            return;
        }

        if (message.length > 5000) {
            showToast("Message is too long.");
            return;
        }

        scanButton.disabled = true;
        scanButton.textContent = "Analyzing...";

        messageResult.innerHTML = "<p>Scanning message with AI and security rules...</p>";

        try {
            const data = await api("/api/analyze", {
                method: "POST",
                body: JSON.stringify({ message })
            });

            renderMessageResult(data);

            state.messages++;
            addXP(15, "Message scanned");
            addActivity(
                `Message scan completed — ${data.risk || "Unknown"} risk`,
                data.risk === "High" ? "danger" : "success"
            );

            await refreshDashboard();
            await loadRecentActivity();

        } catch (error) {
            messageResult.textContent = error.message;
            showToast("Scanner error. Check Flask server and Groq AI.");
        } finally {
            scanButton.disabled = false;
            scanButton.textContent = "Scan Message";
        }
    }

    if (scanButton) {
        scanButton.addEventListener("click", scanMessage);
    }

    const demoButton = $("#demoButton");

    if (demoButton && messageInput) {
        demoButton.addEventListener("click", () => {
            messageInput.value =
                "URGENT! Your bank account will be blocked. " +
                "Verify your account immediately and share your OTP.";

            if (charCount) {
                charCount.textContent = messageInput.value.length;
            }

            scanMessage();
        });
    }

    // ======================================
    // 4. URL SECURITY SCANNER
    // ======================================

    const urlInput = $("#urlInput");
    const urlButton = $("#urlBtn");
    const urlResult = $("#urlResult");

    function renderURLResult(data) {
        if (!urlResult) return;

        const warnings = Array.isArray(data.warnings)
            ? data.warnings
            : [];
                const domainAge = data.domain_age;

        const domainAgeText = domainAge !== null &&
            domainAge !== undefined &&
            Number.isFinite(Number(domainAge))
                ? `${Number(domainAge).toLocaleString()} days (${(Number(domainAge) / 365).toFixed(1)} years)`
                : "Not available";

        urlResult.innerHTML = `
            <div class="result-card ${escapeHTML(
                String(data.risk || "").toLowerCase()
            )}">
                <h3>URL Risk: ${escapeHTML(data.risk || "Unknown")}</h3>
                <h2>${Number(data.score) || 0}/100</h2>
                <p class="domain-age">
    <strong>Domain Age:</strong> ${escapeHTML(domainAgeText)}
</p>

                <h4>Warnings</h4>
                <ul>
                    ${
                        warnings.length
                            ? warnings.map(item =>
                                `<li>${escapeHTML(item)}</li>`
                            ).join("")
                            : "<li>No heuristic warning detected.</li>"
                    }
                </ul>

                <p>${escapeHTML(data.advice || "Use caution with unknown URLs.")}</p>

                <small>
                    Heuristic analysis only. This does not verify live
                    malware or website reputation.
                </small>
            </div>
        `;

        urlResult.style.display = "block";
        urlResult.classList.remove("hidden");
    }

    async function scanURL() {
        if (!urlInput || !urlResult) return;

        const url = urlInput.value.trim();

        if (!url) {
            showToast("Enter a URL first.");
            return;
        }

        urlButton.disabled = true;
        urlButton.textContent = "Checking...";

        urlResult.textContent = "Analyzing URL...";

        try {
            const data = await api("/api/scan-url", {
                method: "POST",
                body: JSON.stringify({ url })
            });

            renderURLResult(data);

            addXP(10, "URL checked");
            addActivity(
                `URL checked — ${data.risk || "Unknown"} risk`,
                data.risk === "High" ? "danger" : "success"
            );

            await loadURLHistory();
            await refreshDashboard();
            await loadRecentActivity();

        } catch (error) {
            urlResult.textContent = error.message;
            showToast("URL scan failed.");
        } finally {
            urlButton.disabled = false;
            urlButton.textContent = "Scan URL";
        }
    }

    if (urlButton) {
        urlButton.addEventListener("click", scanURL);
    }

    // ======================================
    // 5. PASSWORD STRENGTH LAB
    // ======================================

    const passwordInput = $("#passwordInput");
    const togglePassword = $("#togglePassword");
    const strengthBar = $("#strengthBar");
    const strengthText = $("#strengthText");
    const passwordTips = $("#passwordTips");

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener("click", () => {
            passwordInput.type =
                passwordInput.type === "password" ? "text" : "password";
        });
    }

    function checkPassword() {
        if (!passwordInput) return;

        const password = passwordInput.value;

        const checks = [
            password.length >= 8,
            password.length >= 12,
            /[A-Z]/.test(password),
            /[a-z]/.test(password),
            /[0-9]/.test(password),
            /[^A-Za-z0-9]/.test(password)
        ];

        const score = checks.filter(Boolean).length;

        let label = "Very Weak";
        let percentage = 10;

        if (score >= 6) {
            label = "Very Strong";
            percentage = 100;
        } else if (score >= 5) {
            label = "Strong";
            percentage = 80;
        } else if (score >= 4) {
            label = "Medium";
            percentage = 60;
        } else if (score >= 3) {
            label = "Weak";
            percentage = 40;
        }

        if (!password) {
            label = "Enter a password";
            percentage = 0;
        }

        if (strengthText) {
            strengthText.textContent = label;
        }

        if (strengthBar) {
            strengthBar.style.width = `${percentage}%`;
        }

        const tips = [];

        if (password.length < 12) tips.push("Use at least 12 characters.");
        if (!/[A-Z]/.test(password)) tips.push("Add uppercase letters.");
        if (!/[a-z]/.test(password)) tips.push("Add lowercase letters.");
        if (!/[0-9]/.test(password)) tips.push("Add numbers.");
        if (!/[^A-Za-z0-9]/.test(password)) tips.push("Add special characters.");

        if (passwordTips) {
            passwordTips.innerHTML = tips.length
                ? tips.map(tip => `<li>${escapeHTML(tip)}</li>`).join("")
                : "<li>Good password structure. Avoid reusing passwords.</li>";
        }
    }

    if (passwordInput) {
        passwordInput.addEventListener("input", checkPassword);
    }

    // Passwords are checked only in the browser.
    // They are never sent to the Flask backend.

    // ======================================
    // 6. CYBER TERMINAL
    // ======================================

    const terminalForm = $("#terminalForm");
    const terminalInput = $("#terminalInput");
    const terminalOutput = $("#terminalOutput");

    function terminalPrint(message) {
        if (!terminalOutput) return;

        const line = document.createElement("div");
        line.textContent = message;
        terminalOutput.appendChild(line);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    function runTerminalCommand(command) {
        const input = String(command || "").trim().toLowerCase();

        if (!input) return;

        terminalPrint(`visitor@cyberverse:~$ ${input}`);

        switch (input) {
            case "help":
                terminalPrint(
                    "Commands: help, status, tips, whoami, scan demo, clear"
                );
                break;

            case "status":
                terminalPrint("CyberVerse system: ONLINE");
                terminalPrint("Local Flask API: configured");
                terminalPrint("Security modules: ACTIVE");
                break;

            case "tips":
                terminalPrint("Never share OTP, passwords or PINs.");
                terminalPrint("Check URLs before opening links.");
                terminalPrint("Enable two-factor authentication.");
                break;

            case "whoami":
                terminalPrint("You are a CyberVerse security learner.");
                break;

            case "scan demo":
                terminalPrint("Loading demo phishing message...");
                if (messageInput) {
                    messageInput.value =
                        "Congratulations! You won a prize. " +
                        "Click here immediately and share your password.";
                    if (charCount) {
                        charCount.textContent = messageInput.value.length;
                    }
                    messageInput.scrollIntoView({ behavior: "smooth" });
                    setTimeout(() => scanMessage(), 500);
                }
                break;

            case "clear":
                terminalOutput.innerHTML = "";
                break;

            default:
                terminalPrint("Unknown command. Type 'help'.");
        }
    }

    if (terminalForm) {
        terminalForm.addEventListener("submit", event => {
            event.preventDefault();

            runTerminalCommand(terminalInput?.value);

            if (terminalInput) terminalInput.value = "";
        });
    }

    document.querySelectorAll("[data-command]").forEach(button => {
        button.addEventListener("click", () => {
            runTerminalCommand(button.dataset.command);
        });
    });

   
// ======================================
// 7. CYBER ACADEMY - AI POWERED QUIZ
// ======================================

let quiz = [];
let quizIndex = 0;
let quizAnswered = false;
let quizLoading = false;

const quizQuestion = $("#quizQuestion");
const quizOptions = $("#quizOptions");
const quizFeedback = $("#quizFeedback");
const nextQuestion = $("#nextQuestion");
const quizDifficulty = $("#quizDifficulty");
// Regenerate quiz whenever difficulty changes
if (quizDifficulty) {
    quizDifficulty.addEventListener("change", () => {

        if (quizLoading) return;

        generateAIQuiz();

        showToast(
            `Generating ${quizDifficulty.value} difficulty quiz...`
        );

    });
}

// Track correct answers for the current quiz
let quizSessionCorrect = new Set();

// ======================================
// GENERATE QUIZ USING Groq AI 
// ======================================

async function generateAIQuiz() {

    if (quizLoading) return;

    quizLoading = true;

    quiz = [];
    quizIndex = 0;
    quizAnswered = false;
    quizSessionCorrect.clear();

    if (quizQuestion) {
        quizQuestion.textContent = "🤖 AI is generating your quiz...";
    }

    if (quizOptions) {
        quizOptions.innerHTML = "";
    }

    if (quizFeedback) {
        quizFeedback.textContent = "Connecting to local AI...";
    }

    if (nextQuestion) {
        nextQuestion.disabled = true;
        nextQuestion.textContent = "Generating...";
    }

    try {

        const response = await fetch("/api/generate-quiz", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                 difficulty: quizDifficulty ? quizDifficulty.value : "Medium"
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.error || "Unable to generate AI quiz."
            );
        }

        if (!Array.isArray(data.questions) || data.questions.length === 0) {
            throw new Error("AI returned invalid questions.");
        }

        quiz = data.questions;

        quizIndex = 0;

        renderQuiz();

        showToast("AI Quiz generated successfully!");

    } catch (error) {

        console.error("AI QUIZ ERROR:", error);

        if (quizQuestion) {
            quizQuestion.textContent = "AI Quiz generation failed.";
        }

        if (quizFeedback) {
            quizFeedback.textContent =
                error.message + " Please try again.";
        }

        if (nextQuestion) {
            nextQuestion.textContent = "Try Again";
            nextQuestion.disabled = false;
        }

    } finally {

        quizLoading = false;

    }
}

// ======================================
// RENDER CURRENT QUESTION
// ======================================

function renderQuiz() {

    if (!quizQuestion || !quizOptions || quiz.length === 0) {
        return;
    }

    const item = quiz[quizIndex];

    quizAnswered = false;

    quizQuestion.textContent =
        `Question ${quizIndex + 1}/${quiz.length}: ${item.question}`;

    quizOptions.innerHTML = "";

    item.options.forEach((option, index) => {

        const button = document.createElement("button");

        button.className = "quiz-option";
        button.textContent = option;

        button.addEventListener("click", () => {

            if (quizAnswered) return;

            quizAnswered = true;

            const correct = index === item.answer;

            // Disable all options after answering
            Array.from(quizOptions.children).forEach(optionButton => {
                optionButton.disabled = true;
            });

            if (correct) {

                button.classList.add("correct");

                if (!quizSessionCorrect.has(quizIndex)) {

                    quizSessionCorrect.add(quizIndex);

                    addXP(20, "Correct AI quiz answer");

                }

                if (quizFeedback) {
                    quizFeedback.textContent =
                        "✅ Correct! " + item.explanation;
                }

            } else {

                button.classList.add("incorrect");

                quizOptions.children[item.answer]?.classList.add("correct");

                if (quizFeedback) {
                    quizFeedback.textContent =
                        "❌ Not quite! " + item.explanation;
                }

            }

            // Update progress and save
            saveState();
            updateProgress();

            // Enable next button
            if (nextQuestion) {
                nextQuestion.disabled = false;
            }

        });

        quizOptions.appendChild(button);

    });

    if (quizFeedback) {
        quizFeedback.textContent = "";
    }

    if (nextQuestion) {

        nextQuestion.disabled = true;

        nextQuestion.textContent =
            quizIndex === quiz.length - 1
                ? "Finish Quiz"
                : "Next Question";

    }

}

// ======================================
// NEXT QUESTION / RESTART QUIZ
// ======================================

if (nextQuestion) {

    nextQuestion.addEventListener("click", () => {

        // Retry if AI generation previously failed
        if (quiz.length === 0) {

            generateAIQuiz();

            return;
        }

        quizIndex++;

        // Quiz completed
        if (quizIndex >= quiz.length) {

            const finalScore = quizSessionCorrect.size;

            showToast(
                `Quiz completed! Score: ${finalScore}/${quiz.length}`
            );

            if (quizQuestion) {
                quizQuestion.textContent =
                    `🎉 Quiz Completed! You scored ${finalScore}/${quiz.length}.`;
            }

            if (quizOptions) {
                quizOptions.innerHTML = "";
            }

            if (quizFeedback) {
                quizFeedback.textContent =
                    "Great work! Generate a fresh AI quiz to practice again.";
            }

            nextQuestion.textContent = "Generate New Quiz";
            nextQuestion.disabled = false;

            quiz = [];

            return;
        }

        renderQuiz();

    });

}

// ======================================
// START AI QUIZ AUTOMATICALLY
// ======================================

generateAIQuiz();

// ======================================
// END OF SECTION 7
// ======================================

  // ======================================
// 8. THREAT RADAR & SECURITY SCORE
// ======================================

const radarButton = $("#radar-scan-btn");
const radarMessage = $("#radar-message");
const threatCount = $("#threat-count");

const scoreButton = $("#score-check-btn");
const securityScore = $("#security-score");
const scoreStatus = $("#score-status");
const scoreMeter = $("#score-meter");

// Store latest scan data
let radarRecords = [];

// ======================================
// LOAD REAL SCAN DATA
// ======================================

async function loadRadarData() {

    try {

        // Load message history
        const messageData = await api("/api/history");

        const messages = Array.isArray(messageData)
            ? messageData
            : (messageData.history || messageData.records || []);

        // Load URL history
        const urlData = await api("/api/url-history");

        const urls = Array.isArray(urlData)
            ? urlData
            : (urlData.history || urlData.records || []);

        const records = [...messages, ...urls];
        // Load all-time radar statistics
const stats = await api("/api/radar-analytics");
        // Sort scans: newest first
records.sort((a, b) =>
    new Date(b.scanned_at || 0) - new Date(a.scanned_at || 0)
);

// Update radar dots using latest 4 scans
const radarPoints = document.querySelectorAll(".radar-point");
console.log("Radar points found:", radarPoints.length);
console.log("Latest scan records:", records.slice(0, 4));
console.log("Risk values:", records.map(r => ({
    risk: r.risk,
    risk_level: r.risk_level
})));



// DYNAMIC RADAR POINTS


// DYNAMIC RADAR POINTS

const getRisk = (record) => {
    const value = String(
        record.risk || record.risk_level || ""
    ).trim().toLowerCase();

    if (value.includes("high")) return "high";
    if (value.includes("medium")) return "medium";
    if (value.includes("low")) return "low";

    return "low";
};

const highRecords = records.filter(r => getRisk(r) === "high");
const mediumRecords = records.filter(r => getRisk(r) === "medium");
const lowRecords = records.filter(r => getRisk(r) === "low");

const radarData = [
    highRecords[0],
    mediumRecords[0],
    lowRecords[0],
    highRecords[1] || mediumRecords[1] || lowRecords[1]
];

radarPoints.forEach((point, index) => {
    point.classList.remove(
        "high-threat",
        "medium-threat",
        "low-threat",
        "no-threat"
    );

    const record = radarData[index];

    if (record) {
        point.classList.add(`${getRisk(record)}-threat`);
    } else {
        point.classList.add("no-threat");
    }
});


        const high = Number(stats.high) || 0;
const medium = Number(stats.medium) || 0;
const low = Number(stats.low) || 0;

const total = Number(stats.total) || 0;
const threats = Number(stats.threats) || 0;

        // Security score
       const score = Number(stats.security_score) || 0;

        // System health estimate
        const health = score;

        // Network status estimate
        const network = high > 0
            ? "AT RISK"
            : medium > 0
                ? "CAUTION"
                : "SECURE";

        // Update threat count
        if (threatCount) {
            threatCount.textContent = threats;
        }

        const threatDetail = $("#threat-detail");

        if (threatDetail) {
            threatDetail.textContent = `${total} total scans analyzed`;
        }

        // Update system health
        const systemHealth = $("#system-health");

        if (systemHealth) {
            systemHealth.textContent = `${health}%`;
        }

        const healthDetail = $("#health-detail");

        if (healthDetail) {
            healthDetail.textContent = "Scan-based health estimate";
        }

        // Update network status
        const networkStatus = $("#network-status");

        if (networkStatus) {
            networkStatus.textContent = network;
            networkStatus.className =
                network === "SECURE" ? "safe-text" : "warning-text";
        }

        const networkDetail = $("#network-detail");

        if (networkDetail) {
            networkDetail.textContent =
                `${high} high-risk, ${medium} medium-risk scans`;
        }

        // Update risk breakdown
        const highElement = $("#radarHigh");
        const mediumElement = $("#radarMedium");
        const lowElement = $("#radarLow");

        if (highElement) highElement.textContent = high;
        if (mediumElement) mediumElement.textContent = medium;
        if (lowElement) lowElement.textContent = low;

        // Update security score
        if (securityScore) {
            securityScore.textContent = score;
        }

        if (scoreMeter) {
            scoreMeter.style.width = `${score}%`;
        }

        if (scoreStatus) {
            scoreStatus.textContent =
                `Based on ${total} all-time message and URL scans.`;
        }

        // Update radar message
        if (radarMessage) {
            radarMessage.textContent =
                `Analysis complete: ${high} High, ${medium} Medium, ${low} Low risks.`;
        }

        return { high, medium, low, total, threats, score };

    } catch (error) {

        console.error("Threat Radar Error:", error);

        if (radarMessage) {
            radarMessage.textContent =
                "Could not load scan data.";
        }

        return null;
    }
}

// ======================================
// INITIAL RADAR DATA
// ======================================

loadRadarData();

// ======================================
// END OF SECTION 8
// ======================================

    // ======================================
    // 9. SCAN HISTORY
    // ======================================

    const historyList = $("#historyList");

    function renderHistory(records) {
        if (!historyList) return;

        currentHistory = records || [];

        if (!currentHistory.length) {
            historyList.innerHTML = "<p>No message scans yet.</p>";
            return;
        }

        historyList.innerHTML = currentHistory.map(record => `
            <div class="history-card">
                <div>
                    <strong>${escapeHTML(record.risk || "Unknown")} Risk</strong>
                    <p>${escapeHTML(String(record.message || "").slice(0, 100))}</p>
                    <small>${escapeHTML(record.scanned_at || "")}</small>
                </div>

                <div>
                    <strong>${Number(record.score) || 0}/100</strong>
                    <button
                        type="button"
                        class="history-details"
                        data-id="${Number(record.id)}"
                    >
                        Details
                    </button>
                </div>
            </div>
        `).join("");

        historyList.querySelectorAll(".history-details").forEach(button => {
            button.addEventListener("click", () => {
                openHistoryDetails(button.dataset.id);
            });
        });
    }

    async function loadHistory() {
        try {
            const data = await api("/api/history");
            renderHistory(data.history || data.records || data);
            await loadAnalytics();
            renderCharts(currentHistory);
        } catch (error) {
            if (historyList) {
                historyList.textContent = "Could not load scan history.";
            }
        }
    }
    // ==========================================
// LOAD ADVANCED SECURITY ANALYTICS
// ==========================================

async function loadAnalytics() {
    try {
        const data = await api("/api/analytics");
        window.analyticsData = data;

        // Overall statistics
        $("#historyTotal").textContent = data.total_scans;
        $("#historyHigh").textContent = data.high_risk;
        $("#historyMedium").textContent = data.medium_risk;
        $("#historyLow").textContent = data.low_risk;

        // AI analytics
        $("#aiScanCount").textContent = data.ai_scans;
        $("#avgConfidence").textContent =
            `${data.average_consistency}%`;

        // Risk insights
        $("#highRiskCount").textContent = data.high_risk;
        $("#mediumRiskCount").textContent = data.medium_risk;
        $("#lowRiskCount").textContent = data.low_risk;

        console.log("Advanced analytics loaded:", data);

    } catch (error) {
        console.error("Analytics Error:", error);
    }
}

    function renderHistoryStats(records) {
        const total = records.length;
        const high = records.filter(r => r.risk === "High").length;
        const medium = records.filter(r => r.risk === "Medium").length;
        const low = records.filter(r => r.risk === "Low").length;

        const aiRecords = records.filter(r => Number(r.confidence) > 0);

        const average = aiRecords.length
            ? Math.round(
                aiRecords.reduce(
                    (sum, record) => sum + Number(record.confidence || 0),
                    0
                ) / aiRecords.length
            )
            : 0;

        const values = {
            "#historyTotal": total,
            "#historyHigh": high,
            "#historyMedium": medium,
            "#historyLow": low,
            "#aiScanCount": aiRecords.length,
            "#avgConfidence": `${average}%`,
            "#highRiskCount": high,
            "#mediumRiskCount": medium,
            "#lowRiskCount": low
        };

        Object.entries(values).forEach(([selector, value]) => {
            const element = $(selector);
            if (element) element.textContent = value;
        });
    }

    // ======================================
    // 10. ANALYTICS CHARTS
    // ======================================

    function renderCharts(records) {
        if (typeof Chart === "undefined") return;

        const riskCanvas = $("#riskChart");
        const activityCanvas = $("#activityChart");

        if (riskCanvas) {
            if (riskChart) riskChart.destroy();

            const high = Number(window.analyticsData?.high_risk) || 0;
const medium = Number(window.analyticsData?.medium_risk) || 0;
const low = Number(window.analyticsData?.low_risk) || 0;

            riskChart = new Chart(riskCanvas, {
                type: "doughnut",
                data: {
                    labels: ["High", "Medium", "Low"],
                    datasets: [{
                        data: [high, medium, low],
                        backgroundColor: ["#ef4444", "#f59e0b", "#22c55e"],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "bottom"
                        }
                    }
                }
            });
        }

        if (activityCanvas) {
            if (activityChart) activityChart.destroy();

            const last7Days = window.analyticsData?.daily_activity || [];

            activityChart = new Chart(activityCanvas, {
                type: "bar",
                data: {
                    labels: last7Days.map(day => day.date.slice(5)),
                    datasets: [{
                        label: "Message Scans",
                        data: last7Days.map(day => day.count),
                        backgroundColor: "#7867f7",
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            });
        }
    }

    // ======================================
    // 11. HISTORY DETAILS MODAL
    // ======================================

    const scanModal = $("#scanModal");
    const modalDetails = $("#modalScanDetails");
    const closeModal = $("#closeScanModal");

    async function openHistoryDetails(id) {
        try {
            const data = await api(`/api/history/${id}`);

            const record = data.scan || data.record || data;

            if (!modalDetails || !scanModal) return;

            const warnings = Array.isArray(record.warnings)
                ? record.warnings
                : [];

            modalDetails.innerHTML = `
                <h3>${escapeHTML(record.risk || "Unknown")} Risk</h3>
                <h2>${Number(record.score) || 0}/100</h2>

                <p>${escapeHTML(record.message || "")}</p>

                <h4>Warnings</h4>
                <ul>
                    ${
                        warnings.map(w =>
                            `<li>${escapeHTML(w)}</li>`
                        ).join("") || "<li>No warnings recorded.</li>"
                    }
                </ul>

                <h4>Explanation</h4>
                <p>${escapeHTML(record.explanation || "Not available.")}</p>

                <h4>Advice</h4>
                <p>${escapeHTML(record.advice || "Not available.")}</p>

                <p>Scanner consistency estimate: ${Number(record.confidence) || 0}%</p>
                <small>${escapeHTML(record.scanned_at || "")}</small>
            `;

            scanModal.style.display = "flex";

        } catch (error) {
            showToast("Could not load scan details.");
        }
    }

    if (closeModal && scanModal) {
        closeModal.addEventListener("click", () => {
            scanModal.style.display = "none";
        });

        scanModal.addEventListener("click", event => {
            if (event.target === scanModal) {
                scanModal.style.display = "none";
            }
        });
    }

    // ======================================
    // 12. DELETE & EXPORT MESSAGE HISTORY
    // ======================================

    const refreshHistory = $("#refreshHistory");
    const deleteHistory = $("#deleteHistory");
    const exportHistory = $("#exportHistory");

    if (refreshHistory) {
        refreshHistory.addEventListener("click", loadHistory);
    }

    if (deleteHistory) {
        deleteHistory.addEventListener("click", async () => {
            if (!confirm("Delete all message scan history?")) return;

            try {
                await api("/api/history", { method: "DELETE" });
                showToast("Message history deleted.");
                await loadHistory();
            } catch (error) {
                showToast("Could not delete history.");
            }
        });
    }

    if (exportHistory) {
        exportHistory.addEventListener("click", () => {
            window.location.href = "/api/export";
        });
    }
    // ======================================
    // 13. URL SCAN HISTORY
    // ======================================

    const urlHistoryList = $("#urlHistoryList");

    async function loadURLHistory() {
        try {
            const data = await api("/api/url-history");
            const stats = await api("/api/url-history-analytics");

            const records = data.history || data.records || data;

            if (!Array.isArray(records)) return;

            const high = Number(stats.high) || 0;
const medium = Number(stats.medium) || 0;
const low = Number(stats.low) || 0;

            const values = {
                "#urlHistoryTotal": records.length,
                "#urlHistoryHigh": high,
                "#urlHistoryMedium": medium,
                "#urlHistoryLow": low
            };

            Object.entries(values).forEach(([selector, value]) => {
                const element = $(selector);
                if (element) element.textContent = value;
            });

            if (urlHistoryList) {
                urlHistoryList.innerHTML = records.length
                    ? records.map(record => `
                        <div class="history-card">
                            <div>
                                <strong>${escapeHTML(record.risk || "Unknown")} Risk</strong>
                                <p>${escapeHTML(record.url || "")}</p>
                                <small>${escapeHTML(record.scanned_at || "")}</small>
                            </div>
                            <strong>${Number(record.score) || 0}/100</strong>
                        </div>
                    `).join("")
                    : "<p>No URL scans yet.</p>";
            }

        } catch (error) {
            if (urlHistoryList) {
                urlHistoryList.textContent = "Could not load URL history.";
            }
        }
    }

    const refreshURLHistory = $("#refreshUrlHistory");
    const deleteURLHistory = $("#deleteUrlHistory");

    if (refreshURLHistory) {
        refreshURLHistory.addEventListener("click", loadURLHistory);
    }

    if (deleteURLHistory) {
        deleteURLHistory.addEventListener("click", async () => {
            if (!confirm("Delete all URL scan history?")) return;

            try {
                await api("/api/url-history", { method: "DELETE" });
                showToast("URL history deleted.");
                await loadURLHistory();
            } catch (error) {
                showToast("Could not delete URL history.");
            }
        });
    }


// ======================================
// 14. LIVE ACTIVITY FEED
// ======================================

async function loadRecentActivity() {
    const feed = $("#activity-feed");
    if (!feed) return;

    try {
        const data = await api("/api/recent-activity");

        const records = data.activity || data.records || data.history || data;

        if (!Array.isArray(records)) {
            throw new Error("Invalid activity data.");
        }

        // Newest scans first
        records.sort((a, b) =>
            new Date(String(b.scanned_at || "").replace(" ", "T")) -
            new Date(String(a.scanned_at || "").replace(" ", "T"))
        );

        // Remove old static and duplicate activity items
        feed.innerHTML = "";
        feed.querySelectorAll(".activity-item").forEach(item => {
    item.remove();
});
        if (records.length === 0) {
            const empty = document.createElement("p");
            empty.className = "activity-empty";
            empty.textContent = "No scans yet. Complete your first security scan!";
            feed.appendChild(empty);
            return;
        }

        records.slice(0, 8).forEach(record => {

            const isURL = Boolean(record.url);
            const risk = String(record.risk || "Unknown");
            const riskClass = risk.toLowerCase();

            const item = document.createElement("div");
            item.className = "activity-item";

            const icon = document.createElement("span");
            icon.className = "activity-icon";
            icon.textContent = isURL ? "🌐" : "🛡️";

            const content = document.createElement("div");
            content.className = "activity-content";

            const title = document.createElement("strong");
            title.textContent = isURL
                ? "URL Security Scan"
                : "Message Security Scan";

            const description = document.createElement("p");

            const scannedValue = isURL
                ? record.url
                : record.message;

            description.textContent =
                String(scannedValue || "Scan completed").slice(0, 75);

            const details = document.createElement("small");
            details.textContent =
                `Score: ${Number(record.score) || 0}/100`;

            content.append(title, description, details);

            const badge = document.createElement("span");
            badge.className = `activity-risk ${riskClass}`;
            badge.textContent = risk;

            const time = document.createElement("span");
            time.className = "activity-time";

            const date = new Date(
                String(record.scanned_at || "").replace(" ", "T")
            );

            time.textContent = Number.isNaN(date.getTime())
                ? "Recently"
                : date.toLocaleString();

            item.append(icon, content, badge, time);
            feed.appendChild(item);
        });

    } catch (error) {
        console.error("Activity Feed Error:", error);
        feed.textContent = "Could not load recent activity.";
    }
}

    // ======================================
    // 15. DASHBOARD REFRESH
    // ======================================

    async function refreshDashboard() {
    await Promise.allSettled([
        loadHistory(),
        loadURLHistory(),
        loadRadarData()
    ]);
}

    // ======================================
    // 16. INITIALIZATION
    // ======================================

    updateProgress();
    checkPassword();

    loadHistory();
    loadURLHistory();
    loadRecentActivity();

    console.log("CyberVerse initialized successfully.");
});
