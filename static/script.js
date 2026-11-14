
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
        
        activity: []
    };

    let riskChart = null;
    let urlRiskChart = null;
    
    let currentHistory = [];

    function saveState() {
        localStorage.setItem("cyberverseXP", state.xp);
        localStorage.setItem("cyberverseCompleted", state.completed);
        localStorage.setItem("cyberverseMessages", state.messages);
        
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
// 2. XP & LEVELS
// ======================================

function updateProgress() {
    const level = Math.floor(state.xp / 100) + 1;
    const progress = state.xp % 100;

    const values = {
        "#heroXP": `${state.xp} XP`,
        "#totalXP": state.xp,
        "#heroScans": state.messages,
        "#completed": state.completed,
        "#level": level,
        "#nextLevel": 100 - progress
    };

    Object.entries(values).forEach(([selector, value]) => {
        const element = $(selector);
        if (element) element.textContent = value;
    });
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

const messageHistorySearch = $("#messageHistorySearch");
const messageRiskFilter = $("#messageRiskFilter");
const messageSortOrder = $("#messageSortOrder");
const clearMessageFilters = $("#clearMessageFilters");


    
function renderHistory(records) {
    if (!historyList) return;

    currentHistory = records || [];
    applyMessageHistoryFilters();
}

function applyMessageHistoryFilters() {
    if (!historyList) return;

    let filteredRecords = [...currentHistory];

    // SEARCH FILTER
    const searchTerm = messageHistorySearch?.value
        .trim()
        .toLowerCase() || "";

    if (searchTerm) {
        filteredRecords = filteredRecords.filter(record =>
            String(record.message || "")
                .toLowerCase()
                .includes(searchTerm)
        );
    }

    // RISK FILTER
    const selectedRisk = messageRiskFilter?.value || "all";

    if (selectedRisk !== "all") {
        filteredRecords = filteredRecords.filter(record =>
            String(record.risk || "").toLowerCase() ===
            selectedRisk.toLowerCase()
        );
    }

    // SORTING
    const sortOrder = messageSortOrder?.value || "newest";

    filteredRecords.sort((a, b) => {
        if (sortOrder === "highest") {
            return (Number(b.score) || 0) - (Number(a.score) || 0);
        }

        if (sortOrder === "lowest") {
            return (Number(a.score) || 0) - (Number(b.score) || 0);
        }

        const dateA = new Date(a.scanned_at || 0).getTime() || 0;
        const dateB = new Date(b.scanned_at || 0).getTime() || 0;

        return sortOrder === "oldest"
            ? dateA - dateB
            : dateB - dateA;
    });

    // EMPTY STATE
    if (!filteredRecords.length) {
        historyList.innerHTML =
            "<p>No matching message scans found.</p>";
        return;
    }

    
// RENDER RECORDS
historyList.innerHTML = filteredRecords.map(record => {
    const score = Math.min(100, Math.max(0, Number(record.score) || 0));
    const riskClass = String(record.risk || "low").toLowerCase();

    return `
        <div class="history-card">

            <div class="history-card-info">
                <strong>${escapeHTML(record.risk || "Unknown")} Risk</strong>

                <p>${escapeHTML(String(record.message || "").slice(0, 120))}</p>

                <small>${escapeHTML(record.scanned_at || "")}</small>
            </div>

            <div class="history-card-score">

                <div class="circular-score ${escapeHTML(riskClass)}"
                     style="--score: ${score}">

                    <div class="circular-score-inner">
                        <strong>${score}</strong>
                        <small>/100</small>
                    </div>

                </div>

                <button
                    type="button"
                    class="history-details"
                    data-id="${Number(record.id)}"
                >
                    View Details
                </button>

            </div>

        </div>
    `;
}).join("");


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

    
// ======================================
// 10. ANALYTICS CHARTS
// ======================================

function renderCharts(records) {
    if (typeof Chart === "undefined") return;

    const riskCanvas = $("#riskChart");

    if (!riskCanvas) return;

    if (riskChart) {
        riskChart.destroy();
    }

    const high = Number(window.analyticsData?.high_risk) || 0;
    const medium = Number(window.analyticsData?.medium_risk) || 0;
    const low = Number(window.analyticsData?.low_risk) || 0;

    // Total message scans
    const totalScans =
        Number(window.analyticsData?.total_scans) ||
        (Array.isArray(records) ? records.length : 0);

    // Theme-aware center text
    const isLight =
        document.documentElement.dataset.theme === "light";

    const centerTextColor = isLight ? "#172033" : "#f8fafc";
    const centerLabelColor = isLight ? "#64748b" : "#aab4cc";

    // Plugin for center text
    const centerTextPlugin = {
        id: "messageChartCenterText",

        afterDraw(chart) {
            const { ctx, chartArea } = chart;

            if (!chartArea) return;

            const centerX =
                (chartArea.left + chartArea.right) / 2;

            const centerY =
                (chartArea.top + chartArea.bottom) / 2;

            ctx.save();

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // Total number
            ctx.font = "800 30px Inter, sans-serif";
            ctx.fillStyle = centerTextColor;

            ctx.fillText(
                totalScans.toLocaleString(),
                centerX,
                centerY - 10
            );

            // Label
            ctx.font = "600 11px Inter, sans-serif";
            ctx.fillStyle = centerLabelColor;

            ctx.fillText(
                "TOTAL SCANS",
                centerX,
                centerY + 17
            );

            ctx.restore();
        }
    };

    riskChart = new Chart(riskCanvas, {
        type: "doughnut",

        data: {
            labels: ["High", "Medium", "Low"],

            datasets: [{
                data: [high, medium, low],

                backgroundColor: [
                    "#ef4444",
                    "#f59e0b",
                    "#22c55e"
                ],

                borderWidth: 0,
                hoverOffset: 8
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            cutout: "72%",

            plugins: {
                legend: {
                    position: "bottom",

                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },

                tooltip: {
                    enabled: true
                }
            }
        },

        plugins: [centerTextPlugin]
    });
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
    
// MESSAGE HISTORY FILTER EVENTS
messageHistorySearch?.addEventListener("input", applyMessageHistoryFilters);

messageRiskFilter?.addEventListener("change", applyMessageHistoryFilters);

messageSortOrder?.addEventListener("change", applyMessageHistoryFilters);

clearMessageFilters?.addEventListener("click", () => {
    if (messageHistorySearch) messageHistorySearch.value = "";
    if (messageRiskFilter) messageRiskFilter.value = "all";
    if (messageSortOrder) messageSortOrder.value = "newest";

    applyMessageHistoryFilters();
});

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

    
// ======================================
// 13. URL SCAN HISTORY
// ======================================

const urlHistoryList = $("#urlHistoryList");

const urlHistorySearch = $("#urlHistorySearch");
const urlRiskFilter = $("#urlRiskFilter");
const urlSortOrder = $("#urlSortOrder");
const clearUrlFilters = $("#clearUrlFilters");

const refreshUrlHistory = $("#refreshUrlHistory");
const exportUrlHistory = $("#exportUrlHistory");
const deleteUrlHistory = $("#deleteUrlHistory");
let allURLRecords = [];

// ======================================
// URL RISK DISTRIBUTION CHART
// ======================================

function renderURLRiskChart(records) {

    if (typeof Chart === "undefined") return;

    const canvas = document.getElementById("urlRiskChart");

    if (!canvas) return;

    if (urlRiskChart) {
        urlRiskChart.destroy();
    }

    const high = records.filter(record =>
        String(record.risk || "").toLowerCase() === "high"
    ).length;

    const medium = records.filter(record =>
        String(record.risk || "").toLowerCase() === "medium"
    ).length;

    const low = records.filter(record =>
        String(record.risk || "").toLowerCase() === "low"
    ).length;

    const isLight =
        document.documentElement.dataset.theme === "light";

    const textColor = isLight ? "#172033" : "#f8fafc";

    const centerTextPlugin = {
        id: "urlChartCenterText",

        afterDraw(chart) {

            const { ctx, chartArea } = chart;

            if (!chartArea) return;

            const centerX =
                (chartArea.left + chartArea.right) / 2;

            const centerY =
                (chartArea.top + chartArea.bottom) / 2;

            ctx.save();

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = textColor;

            ctx.font = "800 30px Inter, sans-serif";
            ctx.fillText(records.length, centerX, centerY - 10);

            ctx.font = "600 11px Inter, sans-serif";
            ctx.fillText("TOTAL URL SCANS", centerX, centerY + 17);

            ctx.restore();
        }
    };

    urlRiskChart = new Chart(canvas, {

        type: "doughnut",

        data: {
            labels: ["High", "Medium", "Low"],

            datasets: [{
                data: [high, medium, low],

                backgroundColor: [
                    "#ef4444",
                    "#f59e0b",
                    "#22c55e"
                ],

                borderWidth: 0,
                hoverOffset: 8
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "72%",

            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        color: textColor
                    }
                }
            }
        },

        plugins: [centerTextPlugin]
    });
}

async function loadURLHistory() {
    if (!urlHistoryList) return;

    try {
        const data = await api("/api/url-history");

        const records = Array.isArray(data)
            ? data
            : (data.history || data.records || []);

        allURLRecords = records;
        // UPDATE URL HISTORY STATISTICS

const total = records.length;

const high = records.filter(record =>
    String(record.risk || "").trim().toLowerCase() === "high"
).length;

const medium = records.filter(record =>
    String(record.risk || "").trim().toLowerCase() === "medium"
).length;

const low = records.filter(record =>
    String(record.risk || "").trim().toLowerCase() === "low"
).length;

document.getElementById("urlHistoryTotal").textContent = total;
document.getElementById("urlHistoryHigh").textContent = high;
document.getElementById("urlHistoryMedium").textContent = medium;
document.getElementById("urlHistoryLow").textContent = low;
        renderURLRiskChart(allURLRecords);
        renderURLHistory(allURLRecords);

    } catch (error) {
        console.error("URL History Error:", error);
        urlHistoryList.innerHTML =
            "<p>Could not load URL history.</p>";
    }
}


function renderURLHistory(records) {
    if (!urlHistoryList) return;

    let filteredRecords = [...(records || [])];

    const searchText =
        urlHistorySearch?.value.trim().toLowerCase() || "";

    const selectedRisk =
        urlRiskFilter?.value.toLowerCase() || "all";

    const sortOrder = urlSortOrder?.value || "newest";

    // SEARCH
    if (searchText) {
        filteredRecords = filteredRecords.filter(record =>
            String(record.url || "")
                .toLowerCase()
                .includes(searchText)
        );
    }

    // RISK FILTER
    if (selectedRisk !== "all") {
        filteredRecords = filteredRecords.filter(record =>
            String(record.risk || "").toLowerCase() === selectedRisk
        );
    }

    // SORT
    filteredRecords.sort((a, b) => {
        if (sortOrder === "highest") {
            return Number(b.score || 0) - Number(a.score || 0);
        }

        if (sortOrder === "lowest") {
            return Number(a.score || 0) - Number(b.score || 0);
        }

        const dateA = new Date(a.scanned_at || 0).getTime() || 0;
        const dateB = new Date(b.scanned_at || 0).getTime() || 0;

        return sortOrder === "oldest"
            ? dateA - dateB
            : dateB - dateA;
    });

    // EMPTY STATE
    if (!filteredRecords.length) {
        urlHistoryList.innerHTML = records.length
            ? "<p>No URL scans match your filters.</p>"
            : "<p>No URL scans yet.</p>";
        return;
    }

    // HISTORY CARDS
    urlHistoryList.innerHTML = filteredRecords.map(record => {
        const score = Math.min(
            100,
            Math.max(0, Number(record.score) || 0)
        );

        const risk = String(record.risk || "Unknown");
        const riskClass = risk.toLowerCase();

        return `
            <div class="history-card url-history-card">

                <div class="history-card-info">
                    <strong>${escapeHTML(risk)} Risk</strong>

                    <p>${escapeHTML(record.url || "URL unavailable")}</p>

                    <small>${escapeHTML(record.scanned_at || "")}</small>
                </div>

                <div class="history-card-score">

                    <div class="circular-score ${escapeHTML(riskClass)}"
                         style="--score: ${score}">

                        <div class="circular-score-inner">
                            <strong>${score}</strong>
                            <small>/100</small>
                        </div>

                    </div>

                    <button
                        type="button"
                        class="history-details url-view-details"
                        data-id="${Number(record.id)}">
                        View Details
                    </button>

                </div>

            </div>
        `;
    }).join("");

    // OPEN URL DETAILS IN SHARED MODAL
    urlHistoryList.querySelectorAll(".url-view-details").forEach(button => {
        button.addEventListener("click", () => {

            const record = allURLRecords.find(
                item => String(item.id) === button.dataset.id
            );

            if (!record || !modalDetails || !scanModal) return;

            const score = Math.min(
                100,
                Math.max(0, Number(record.score) || 0)
            );

            const risk = String(record.risk || "Unknown");

            const warnings = Array.isArray(record.warnings)
                ? record.warnings
                : record.warnings
                    ? [record.warnings]
                    : [];

            modalDetails.innerHTML = `
                <div class="url-scan-report">

                    <h2>URL Security Report</h2>

                    <h3>${escapeHTML(risk)} Risk</h3>

                    <h2>${score}/100</h2>

                    <h4>Scanned URL</h4>
                    <p>${escapeHTML(record.url || "Not available.")}</p>

                    <h4>Risk Level</h4>
                    <p>${escapeHTML(risk)}</p>

                    <h4>Security Warnings</h4>
                    <ul>
                        ${
                            warnings.length
                                ? warnings.map(warning =>
                                    `<li>${escapeHTML(warning)}</li>`
                                ).join("")
                                : "<li>No warnings recorded.</li>"
                        }
                    </ul>

                    <h4>Recommendation</h4>
                    <p>${escapeHTML(record.advice || "Not available.")}</p>

                    <h4>Scan Date</h4>
                    <p>${escapeHTML(record.scanned_at || "Not available.")}</p>

                    <small>
                        Heuristic analysis only. This does not verify live
                        malware or website reputation.
                    </small>

                </div>
            `;

            scanModal.style.display = "flex";
        });
    });
}
// ======================================
// URL HISTORY FILTER EVENTS
// ======================================

urlHistorySearch?.addEventListener("input", () => {
    renderURLHistory(allURLRecords);
});

urlRiskFilter?.addEventListener("change", () => {
    renderURLHistory(allURLRecords);
});

urlSortOrder?.addEventListener("change", () => {
    renderURLHistory(allURLRecords);
});

clearUrlFilters?.addEventListener("click", () => {
    if (urlHistorySearch) urlHistorySearch.value = "";
    if (urlRiskFilter) urlRiskFilter.value = "all";
    if (urlSortOrder) urlSortOrder.value = "newest";

    renderURLHistory(allURLRecords);
});

// ======================================
// URL HISTORY BUTTON EVENTS
// ======================================

// REFRESH URL HISTORY
refreshUrlHistory?.addEventListener("click", async () => {
    await loadURLHistory();
    showToast("URL history refreshed.");
});

// EXPORT URL HISTORY AS CSV
exportUrlHistory?.addEventListener("click", () => {
    window.location.href = "/api/export-url-history";
});

// DELETE URL HISTORY
deleteUrlHistory?.addEventListener("click", async () => {

    const confirmed = confirm(
        "Are you sure you want to delete all URL scan history?"
    );

    if (!confirmed) return;

    try {
        await api("/api/url-history", {
            method: "DELETE"
        });

        showToast("URL history deleted successfully.");

        await refreshDashboard();
        await loadRecentActivity();

    } catch (error) {
        console.error("URL History Delete Error:", error);
        showToast("Could not delete URL history.");
    }
});



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



// ==========================================
// CYBERVERSE - AI SECURITY LAB
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    let aiRiskChart = null;

    const promptInput = document.getElementById("aiSecurityPrompt");
const responseInput = document.getElementById("aiSecurityResponse");
const testButton = document.getElementById("runAiSecurityTest");
const resultBox = document.getElementById("aiSecurityResult");
const historyBox = document.getElementById("aiSecurityHistory");

const refreshButton = document.getElementById("refreshAiHistory");
const exportButton = document.getElementById("exportAiHistory");
const deleteButton = document.getElementById("deleteAiHistory");

// AI HISTORY FILTER CONTROLS
const aiHistorySearch = document.getElementById("aiHistorySearch");
const aiHistoryRiskFilter = document.getElementById("aiHistoryRiskFilter");
const aiHistorySort = document.getElementById("aiHistorySort");

let allAISecurityHistory = [];

    if (!responseInput || !testButton || !resultBox || !historyBox) {
        return;
    }

    const escapeHTML = (value) => {
        return String(value ?? "").replace(/[&<>"']/g, (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    };

// ======================================
// RENDER AI SECURITY HISTORY
// ======================================

function renderAISecurityHistory() {
    if (!historyBox) return;

    let filteredHistory = [...allAISecurityHistory];

    // SEARCH
    const searchText = (aiHistorySearch?.value || "")
        .toLowerCase().trim();

    if (searchText) {
        filteredHistory = filteredHistory.filter(item =>
            [
                item.prompt,
                item.response,
                item.risk_level,
                item.id
            ].join(" ").toLowerCase().includes(searchText)
        );
    }

    // RISK FILTER
    const selectedRisk = aiHistoryRiskFilter?.value || "all";

    if (selectedRisk !== "all") {
        filteredHistory = filteredHistory.filter(item =>
            String(item.risk_level || "").toLowerCase() ===
            selectedRisk.toLowerCase()
        );
    }

    // SORT
    const sortOrder = aiHistorySort?.value || "newest";

    filteredHistory.sort((a, b) => {
        if (sortOrder === "highest") {
            return Number(b.risk_score || 0) -
                   Number(a.risk_score || 0);
        }

        if (sortOrder === "lowest") {
            return Number(a.risk_score || 0) -
                   Number(b.risk_score || 0);
        }

        return sortOrder === "oldest"
            ? Number(a.id || 0) - Number(b.id || 0)
            : Number(b.id || 0) - Number(a.id || 0);
    });

    // EMPTY STATE
    if (!filteredHistory.length) {
        historyBox.innerHTML =
            "<p>No matching AI security tests found.</p>";
        return;
    }

    // MESSAGE HISTORY STYLE CARDS
    historyBox.innerHTML = filteredHistory.map(item => {
        const score = Math.min(
            100,
            Math.max(0, Number(item.risk_score) || 0)
        );

        const risk = String(item.risk_level || "Unknown");
        const riskClass = risk.toLowerCase();
        const preview = item.prompt || item.response || "AI security test";

        return `
            <div class="history-card ai-history-card">

                <div class="history-card-info">

                    <strong>${escapeHTML(risk)} Risk</strong>

                    <p>${escapeHTML(String(preview).slice(0, 120))}</p>

                    <small>${escapeHTML(item.tested_at || "")}</small>

                </div>

                <div class="history-card-score">

                    <div class="circular-score ${escapeHTML(riskClass)}"
                         style="--score: ${score}">

                        <div class="circular-score-inner">
                            <strong>${score}</strong>
                            <small>/100</small>
                        </div>

                    </div>

                    <button
                        type="button"
                        class="history-details ai-view-details"
                        data-id="${Number(item.id)}">
                        View Details
                    </button>

                </div>

            </div>
        `;
    }).join("");

    // VIEW DETAILS
    historyBox.querySelectorAll(".ai-view-details").forEach(button => {
        button.addEventListener("click", () => {
            const item = allAISecurityHistory.find(
                record => String(record.id) === button.dataset.id
            );

            if (item) {
                showAISecurityDetails(item);
            }
        });
    });
}

// ======================================
// SHOW COMPLETE AI SECURITY REPORT
// ======================================

function showAISecurityDetails(item) {

    const modal = document.getElementById("scanModal");
    const modalContent = document.getElementById("modalScanDetails");

    if (!modal || !modalContent) {
        console.error("AI Security details modal not found.");
        return;
    }

    const score = Math.min(
        100,
        Math.max(0, Number(item.risk_score) || 0)
    );

    const risk = String(item.risk_level || "Unknown");

    const findings = Array.isArray(item.findings)
        ? item.findings
        : [];

    modalContent.innerHTML = `
        <div class="ai-audit-report">

            <h2>AI Security Audit Report</h2>

            <h3>Test #${Number(item.id)}</h3>

            <h2>${score}/100</h2>

            <p>
                <strong>Risk Level:</strong>
                <span class="risk-badge ${escapeHTML(risk.toLowerCase())}">
                    ${escapeHTML(risk)}
                </span>
            </p>

            <h4>Original Prompt</h4>
            <p>${escapeHTML(item.prompt || "Not available.")}</p>

            <h4>Complete AI Response</h4>
            <p>${escapeHTML(item.response || "Not available.")}</p>

            <h4>Security Findings</h4>
            <ul>
                ${
                    findings.length
                        ? findings.map(finding =>
                            `<li>${escapeHTML(finding)}</li>`
                        ).join("")
                        : "<li>No findings recorded.</li>"
                }
            </ul>

            <h4>Recommendation</h4>
            <p>${escapeHTML(item.recommendation || "Not available.")}</p>

            <h4>Explanation</h4>
            <p>${escapeHTML(item.explanation || "Not available.")}</p>

            <h4>Test Date</h4>
            <p>${escapeHTML(item.tested_at || "Not available.")}</p>

        </div>
    `;

    modal.style.display = "flex";
}
    // ======================================
    // LOAD AI SECURITY HISTORY
    // ======================================
   
function renderAIRiskChart(history) {
    if (typeof Chart === "undefined") return;

    const canvas = document.getElementById("aiRiskChart");
    if (!canvas) return;

    if (aiRiskChart) {
        aiRiskChart.destroy();
        aiRiskChart = null;
    }

    const records = Array.isArray(history) ? history : [];

    const counts = {
        High: 0,
        Medium: 0,
        Low: 0
    };

    records.forEach(item => {
        const risk = String(item.risk_level || "")
            .trim()
            .toLowerCase();

        if (risk === "high" || risk === "critical") {
            counts.High++;
        } else if (risk === "medium") {
            counts.Medium++;
        } else if (risk === "low") {
            counts.Low++;
        }
    });

    const totalScans = records.length;

    // Theme-aware center text
    const isLight =
        document.documentElement.dataset.theme === "light";

    const centerTextColor = isLight ? "#172033" : "#f8fafc";
    const centerLabelColor = isLight ? "#64748b" : "#aab4cc";

    // Center text plugin
    const centerTextPlugin = {
        id: "aiRiskChartCenterText",

        afterDraw(chart) {
            const { ctx, chartArea } = chart;

            if (!chartArea) return;

            const centerX =
                (chartArea.left + chartArea.right) / 2;

            const centerY =
                (chartArea.top + chartArea.bottom) / 2;

            ctx.save();
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // Total AI tests
            ctx.font = "800 30px Inter, sans-serif";
            ctx.fillStyle = centerTextColor;

            ctx.fillText(
                totalScans.toLocaleString(),
                centerX,
                centerY - 10
            );

            // Center label
            ctx.font = "600 11px Inter, sans-serif";
            ctx.fillStyle = centerLabelColor;

            ctx.fillText(
                "TOTAL SCANS",
                centerX,
                centerY + 17
            );

            ctx.restore();
        }
    };

    aiRiskChart = new Chart(canvas, {
        type: "doughnut",

        data: {
            labels: ["High", "Medium", "Low"],

            datasets: [{
                data: [
                    counts.High,
                    counts.Medium,
                    counts.Low
                ],

                backgroundColor: [
                    "#ef4444",
                    "#f59e0b",
                    "#22c55e"
                ],

                borderColor: [
                    "#ef4444",
                    "#f59e0b",
                    "#22c55e"
                ],

                borderWidth: 2,
                hoverOffset: 8
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            cutout: "65%",

            plugins: {
                legend: {
                    display: true,
                    position: "bottom"
                },

                tooltip: {
                    enabled: true
                }
            }
        },

        plugins: [centerTextPlugin]
    });
}


// ======================================
// LOAD AI SECURITY HISTORY
// ======================================

async function loadAISecurityHistory() {
    if (!historyBox) return;

    try {
        historyBox.innerHTML = "<p>Loading AI security history...</p>";

        const data = await fetch("/api/ai-security-history");

        if (!data.ok) {
            throw new Error("Unable to fetch AI security history.");
        }

        const result = await data.json();

        // Support different API response formats
        const records = Array.isArray(result)
            ? result
            : (result.history || result.records || []);

        allAISecurityHistory = records;

        // Calculate statistics
        const total = records.length;

        const high = records.filter(item =>
            ["high", "critical"].includes(
                String(item.risk_level || "").trim().toLowerCase()
            )
        ).length;

        const medium = records.filter(item =>
            String(item.risk_level || "").trim().toLowerCase() === "medium"
        ).length;

        const low = records.filter(item =>
            String(item.risk_level || "").trim().toLowerCase() === "low"
        ).length;

        // Update dashboard statistics
        const stats = {
            aiSecurityTotal: total,
            aiSecurityHigh: high,
            aiSecurityMedium: medium,
            aiSecurityLow: low
        };

        Object.entries(stats).forEach(([id, value]) => {
            const element = document.getElementById(id);

            if (element) {
                element.textContent = value;
            }
        });

        // Update chart and history records
        renderAIRiskChart(records);
        renderAISecurityHistory();

        console.log("AI Security History loaded:", records);

    } catch (error) {
        console.error("AI Security History Error:", error);

        historyBox.innerHTML =
            "<p>Could not load AI security history. Please refresh.</p>";
    }
}


    // ======================================
    // DISPLAY AI SECURITY RESULT
    // ======================================

    function renderAISecurityResult(data) {

        const score = Number(data.risk_score) || 0;
        const confidence = Number(data.confidence) || 0;
        const risk = String(data.risk_level || "Unknown");

        const findings = Array.isArray(data.findings)
            ? data.findings
            : [];

        resultBox.innerHTML = `
            <div class="ai-test-result">

                <h3>AI Security Audit Report</h3>

                <p>
                    <strong>Test ID:</strong>
                    ${Number(data.test_id)}
                </p>

                <h2>${score}/100</h2>

                <p>
                    <strong>Risk Level:</strong>
                    <span class="risk-badge ${escapeHTML(risk.toLowerCase())}">
                        ${escapeHTML(risk)}
                    </span>
                </p>

                <p>
                    <strong>AI Confidence:</strong>
                    ${confidence}%
                </p>

                <h4>Analysis Explanation</h4>
                <p>${escapeHTML(data.explanation || "Analysis completed.")}</p>

                <h4>Security Findings</h4>

                <ul>
                    ${
                        findings.length
                            ? findings.map(item =>
                                `<li>${escapeHTML(item)}</li>`
                            ).join("")
                            : "<li>No significant issues detected.</li>"
                    }
                </ul>

                <h4>Recommendations</h4>
                <p>
                    ${escapeHTML(
                        data.recommendation || "Continue monitoring AI outputs."
                    )}
                </p>

                <small>
                    Analysis method: ${escapeHTML(
                        data.analysis_method || "AI Security Analysis"
                    )}
                </small>

                <p class="notice">
                    AI-based assessment only. This report does not guarantee
                    that an AI system or response is completely safe.
                </p>

            </div>
        `;

        resultBox.style.display = "block";
    }

    // ======================================
    // RUN AI RESPONSE SECURITY TEST
    // ======================================

    async function runAISecurityTest() {

        const aiResponse = responseInput.value.trim();
        const prompt = promptInput ? promptInput.value.trim() : "";

        if (!aiResponse) {
            resultBox.textContent =
                "Please paste an AI-generated response first.";

            responseInput.focus();
            return;
        }

        if (aiResponse.length > 10000 || prompt.length > 10000) {
            resultBox.textContent =
                "Input must not exceed 10000 characters.";

            return;
        }

        testButton.disabled = true;
        testButton.textContent = "Analyzing with AI...";

        resultBox.innerHTML = `
            <p>Analyzing AI response...</p>
            <p>Checking sensitive data, unsafe instructions and security risks.</p>
        `;

        try {

            const response = await fetch("/api/ai-security-test", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    prompt: prompt,
                    response: aiResponse,
                    test_type: "full"
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.error || "AI security analysis failed."
                );
            }

            renderAISecurityResult(data);

            await loadAISecurityHistory();

            if (typeof showToast === "function") {
                showToast("AI security analysis completed!");
            }

        } catch (error) {

            resultBox.textContent = error.message;

            console.error("AI Security Test Error:", error);

        } finally {

            testButton.disabled = false;
            testButton.textContent = "Analyze AI Response →";

        }
    }

    // ======================================
    // EVENT LISTENERS
    // ======================================

    testButton.addEventListener("click", runAISecurityTest);
    // EXPORT AI SECURITY HISTORY
if (exportButton) {
    exportButton.addEventListener("click", () => {
        window.location.href = "/api/export-ai-security-history";
    });
}


// DELETE AI SECURITY HISTORY
if (deleteButton) {
    deleteButton.addEventListener("click", async () => {

        const confirmed = confirm(
            "Are you sure you want to delete all AI Security history?"
        );

        if (!confirmed) return;

        try {
            const data = await api("/api/ai-security-history", {
                method: "DELETE"
            });

            if (data.success) {
                alert("AI Security history deleted successfully!");
                await loadAISecurityHistory();
            } else {
                alert(data.message || "Unable to delete history.");
            }

        } catch (error) {
            console.error("Delete AI History Error:", error);
            alert("Something went wrong while deleting history.");
        }
    });
}

    if (refreshButton) {
        refreshButton.addEventListener("click", loadAISecurityHistory);
    }
    // AI HISTORY SEARCH
if (aiHistorySearch) {
    aiHistorySearch.addEventListener("input", renderAISecurityHistory);
}

// AI HISTORY RISK FILTER
if (aiHistoryRiskFilter) {
    aiHistoryRiskFilter.addEventListener("change", renderAISecurityHistory);
}

// AI HISTORY SORT
if (aiHistorySort) {
    aiHistorySort.addEventListener("change", renderAISecurityHistory);
}

    loadAISecurityHistory();

});


/* =========================================
   CYBERVERSE INTERACTIVE TERMINAL
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const terminalForm = document.getElementById("terminalForm");
    const terminalInput = document.getElementById("terminalInput");
    const terminalOutput = document.getElementById("terminalOutput");

    if (!terminalForm || !terminalInput || !terminalOutput) return;

    let commandHistory = [];
    let historyIndex = -1;

    function printLine(message, className = "") {
    const line = document.createElement("p");
    line.textContent = message;

    if (className) {
        line.className = className;
    }

    const text = String(message).trim();

    if (
        text.startsWith("[ SYSTEM") ||
        text.startsWith("[ SECURITY") ||
        text.startsWith("[ TERMINAL")
    ) {
        line.classList.add("terminal-category");
    } else if (text.includes("→")) {
        line.classList.add("terminal-command-item");
    } else if (text.startsWith("TIP:")) {
        line.classList.add("terminal-tip");
    }

    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

    function runCommand(command) {

        const parts = command.trim().split(/\s+/);
        const action = (parts[0] || "").toLowerCase();

        switch (action) {

            case "help":
    printLine("╔══════════════════════════════════════╗", "terminal-welcome");
    printLine("       CYBERVERSE COMMAND CENTER");
    printLine("╚══════════════════════════════════════╝", "terminal-welcome");

    printLine("");
    printLine(" [ SYSTEM COMMANDS ]");
    printLine(" help             → Show all commands");
    printLine(" status           → View simulator status");
    printLine(" whoami           → Display user identity");

    printLine("");
    printLine(" [ SECURITY TOOLS ]");
    printLine(" network          → Network diagnostics");
    printLine(" scan             → Run simulated security scan");
    printLine(" password-check   → Password security tips");
    printLine(" tips             → Security awareness tips");

    printLine("");
    printLine(" [ TERMINAL TOOLS ]");
    printLine(" history          → View command history");
    printLine(" clear            → Clear terminal output");

    printLine("");
    printLine(" TIP: Use ↑ and ↓ to navigate command history.");
    break;
                
            case "status":
    printLine("CyberVerse system: ONLINE (DEMO)");
    printLine("Security modules: SIMULATED");
    printLine("Environment: Safe training simulator");
    break;

case "tips":
    printLine("Never share OTP, passwords or PINs.");
    printLine("Always verify URLs before opening links.");
    printLine("Enable two-factor authentication.");
    printLine("Use unique, strong passwords.");
    break;

            case "whoami":
                printLine("User: CyberVerse Visitor");
                printLine("Role: Security Training Learner");
                printLine("Environment: Safe Local Simulator");
                break;

            case "network":
                printLine("NETWORK DIAGNOSTICS");
                printLine("Connection: SIMULATED");
                printLine("Firewall: ACTIVE (DEMO)");
                printLine("Network status: SECURE (DEMO)");
                printLine("No real network inspection performed.");
                break;

            case "scan":
                printLine("Initializing simulated security scan...");
                printLine("[OK] Checking demo firewall status");
                printLine("[OK] Reviewing sample security settings");
                printLine("[OK] Checking simulated network indicators");
                printLine("Scan complete. No real system was scanned.", "terminal-welcome");
                break;

            case "password-check":
                printLine("PASSWORD SECURITY TIPS");
                printLine("1. Use at least 14 characters.");
                printLine("2. Mix uppercase, lowercase, numbers and symbols.");
                printLine("3. Never reuse passwords across accounts.");
                printLine("4. Use a trusted password manager.");
                printLine("Never enter your real password in this terminal.");
                break;

            case "history":
                if (commandHistory.length === 0) {
                    printLine("No previous commands.");
                } else {
                    commandHistory.forEach((item, index) => {
                        printLine(`${index + 1}. ${item}`);
                    });
                }
                break;

            case "clear":
                terminalOutput.innerHTML = "";
                printLine("CyberVerse Terminal cleared.", "terminal-welcome");
                break;

            case "":
                break;

            default:
                printLine(`Command not found: ${action}`);
                printLine("Type 'help' to see available commands.");
        }
    }

    terminalForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const command = terminalInput.value.trim();

        if (!command) return;

        printLine(`visitor@cyberverse:~$ ${command}`, "terminal-command");

        commandHistory.push(command);
        historyIndex = commandHistory.length;

        runCommand(command);

        terminalInput.value = "";
    });

    terminalInput.addEventListener("keydown", (event) => {

        if (event.key === "ArrowUp") {
            event.preventDefault();

            if (historyIndex > 0) {
                historyIndex--;
                terminalInput.value = commandHistory[historyIndex];
            }
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();

            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                terminalInput.value = commandHistory[historyIndex];
            } else {
                historyIndex = commandHistory.length;
                terminalInput.value = "";
            }
        }
        
        });

    // TERMINAL COMMAND AUTOCOMPLETE

    const terminalCommands = [
        "help",
        "status",
        "tips",
        "whoami",
        "network",
        "scan",
        "password-check",
        "history",
        "clear"
    ];

    const commandList = document.createElement("datalist");
    commandList.id = "terminalCommands";

    terminalCommands.forEach(command => {
        const option = document.createElement("option");
        option.value = command;
        commandList.appendChild(option);
    });

    terminalOutput.parentElement.appendChild(commandList);
    terminalInput.setAttribute("list", "terminalCommands");

});
