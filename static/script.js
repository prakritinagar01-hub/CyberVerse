
const $ = (selector) => document.querySelector(selector);

// ==========================================
// 1. GAME STATE AND QUIZ
// ==========================================

const state = {
    xp: 0,
    completed: 0,
    messages: 0,
    quizCorrect: false,
    quizIndex: 0
};

const quiz = [
    {
        question: "What should you do if an unexpected email asks you to verify your password using a link?",
        options: [
            "Click quickly before the account closes",
            "Avoid the link and verify through the official website or app",
            "Forward it to all your friends"
        ],
        answer: 1,
        explanation: "Correct! Use a trusted route to the service instead of an unexpected link."
    },
    {
        question: "Which is the safest way to handle a one-time password (OTP)?",
        options: [
            "Share it with a caller who says they are support",
            "Post it in a group for help",
            "Never share it with anyone"
        ],
        answer: 2,
        explanation: "Correct! Legitimate support should not ask you to reveal your OTP."
    },
    {
        question: "A message says you won a prize you never entered to win. What is a warning sign?",
        options: [
            "It asks you to click a link urgently",
            "It has a greeting",
            "It arrived in the morning"
        ],
        answer: 0,
        explanation: "Correct! Unexpected rewards and urgent links are common scam signals."
    },
    {
        question: "What helps make an account safer?",
        options: [
            "Reuse one password everywhere",
            "Use unique passwords and enable MFA",
            "Use your birthday as a password"
        ],
        answer: 1,
        explanation: "Correct! Unique passwords and multi-factor authentication improve account security."
    }
];

const saved = (() => {
    try {
        return JSON.parse(localStorage.getItem("cyberverse-progress")) || {};
    } catch {
        return {};
    }
})();

state.xp = Number(saved.xp) || 0;
state.completed = Number(saved.completed) || 0;
state.messages = Number(saved.messages) || 0;
state.quizCorrect = Boolean(saved.quizCorrect);


// ==========================================
// 2. PROGRESS AND XP
// ==========================================

function persist() {
    localStorage.setItem("cyberverse-progress", JSON.stringify({
        xp: state.xp,
        completed: state.completed,
        messages: state.messages,
        quizCorrect: state.quizCorrect
    }));
}

function toast(message) {
    const el = $("#toast");
    if (!el) return;

    el.textContent = message;
    el.classList.add("show");

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {
        el.classList.remove("show");
    }, 2600);
}

function awardXP(amount, labName) {
    state.xp += amount;
    state.completed += 1;

    persist();
    renderStats();

    toast(`+${amount} XP earned · ${labName} completed`);
}

function renderStats() {
    const level = Math.floor(state.xp / 100) + 1;
    const progress = state.xp % 100;

    const badgeCount =
        Number(state.completed >= 1) +
        Number(state.messages >= 3) +
        Number(state.quizCorrect);

    if ($("#totalXP")) $("#totalXP").textContent = state.xp;
    if ($("#heroXP")) $("#heroXP").textContent = `${state.xp} XP`;
    if ($("#heroScans")) $("#heroScans").textContent = state.completed;
    if ($("#completed")) $("#completed").textContent = state.completed;
    if ($("#level")) $("#level").textContent = level;

    if ($("#nextLevel")) {
        $("#nextLevel").textContent = `${100 - progress} XP to next level`;
    }

    if ($("#badges")) $("#badges").textContent = badgeCount;

    if ($("#badgeHint")) {
        $("#badgeHint").textContent = badgeCount
            ? "Keep collecting badges"
            : "Your first badge awaits";
    }

    if ($("#progressLabel")) {
        $("#progressLabel").textContent = `${progress} / 100 XP`;
    }

    if ($("#progressBar")) {
        $("#progressBar").style.width = `${progress}%`;
    }

    if ($("#badgeFirst")) {
        $("#badgeFirst").classList.toggle("unlocked", state.completed >= 1);
    }

    if ($("#badgeAnalyst")) {
        $("#badgeAnalyst").classList.toggle("unlocked", state.messages >= 3);
    }

    if ($("#badgeScholar")) {
        $("#badgeScholar").classList.toggle("unlocked", state.quizCorrect);
    }

    document.querySelectorAll(".achievement").forEach(el => {
        const status = el.querySelector(".achievement-state");

        if (status) {
            status.textContent = el.classList.contains("unlocked")
                ? "UNLOCKED"
                : "LOCKED";
        }
    });
}


// ==========================================
// 3. RULE-BASED MESSAGE ANALYSIS
// ==========================================

function analyseMessage(text) {
    const checks = [
        {
            pattern: /\b(urgent|immediately|act now|within 24 hours|right away)\b/i,
            points: 20,
            warning: "Urgent or pressuring language"
        },
        {
            pattern: /\b(password|otp|one[- ]time passcode|pin)\b/i,
            points: 25,
            warning: "Requests or mentions sensitive credentials"
        },
        {
            pattern: /\b(click here|verify (your )?account|login now|reset your account)\b/i,
            points: 25,
            warning: "Call to action that may lead to a fake login page"
        },
        {
            pattern: /\b(won a prize|claim (your )?(reward|gift)|free gift|lottery winner)\b/i,
            points: 20,
            warning: "Unexpected prize or reward language"
        },
        {
            pattern: /\b(suspended|locked|limited access|account will close)\b/i,
            points: 15,
            warning: "Threat of account suspension or loss of access"
        },
        {
            pattern: /\b(gift card|wire transfer|crypto payment|send money)\b/i,
            points: 15,
            warning: "Unusual payment request"
        }
    ];

    const matched = checks.filter(check => check.pattern.test(text));

    const warnings = matched.map(check => check.warning);

    const score = Math.min(
        100,
        matched.reduce((sum, check) => sum + check.points, 0)
    );

    const risk = score >= 50
        ? "High"
        : score >= 25
            ? "Medium"
            : "Low";

    return { score, risk, warnings };
}


// ==========================================
// 4. MESSAGE SCANNER - AI API
// ==========================================

const messageInput = $("#messageInput");
const scanButton = $("#scanButton");
const messageResult = $("#messageResult");

if (messageInput) {
    messageInput.addEventListener("input", e => {
        if ($("#charCount")) {
            $("#charCount").textContent =
                `${e.target.value.length} / 3000`;
        }
    });
}

if (scanButton && messageInput && messageResult) {
    scanButton.addEventListener("click", async () => {
        const message = messageInput.value.trim();

        if (!message) {
            toast("Paste a message first to run the analysis.");
            messageInput.focus();
            return;
        }

        if (message.length > 5000) {
            toast("Message is too long.");
            return;
        }

        scanButton.disabled = true;
        scanButton.textContent = "Analyzing...";

        try {
            const response = await fetch("/api/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Analysis failed.");
            }

            state.messages += 1;

            messageResult.classList.remove("hidden");

            const heading = document.createElement("h4");

            const riskLabel = document.createElement("span");
            riskLabel.className = `risk-${String(result.risk).toLowerCase()}`;
            riskLabel.textContent = String(result.risk).toUpperCase();

            heading.textContent = "Risk estimate: ";
            heading.append(riskLabel, ` · ${result.score}/100`);

            const advice = document.createElement("p");
            advice.textContent = result.advice || "Stay alert.";

            const warningList = document.createElement("ul");

            (result.warnings || []).forEach(warning => {
                const li = document.createElement("li");
                li.textContent = warning;
                warningList.appendChild(li);
            });

            const method = document.createElement("p");
            method.style.marginTop = "8px";
            method.style.color = "#7485a9";
            method.style.fontSize = ".67rem";

            method.textContent =
                `${result.analysis_method || "Local analysis"} · A low score does not guarantee safety.`;

            messageResult.replaceChildren(
                heading,
                advice,
                warningList,
                method
            );

            awardXP(20, "Message scan");
            logMessageScan(result);

            // Refresh saved scan history
            loadScanHistory();

        } catch (error) {
            toast(error.message || "Could not connect to the server.");
            console.error(error);
        } finally {
            scanButton.disabled = false;
           scanButton.textContent = "Analyze message →";
        }
    });
}


// ==========================================
// 5. DEMO BUTTON
// ==========================================

const demoButton = $("#demoButton");

if (demoButton) {
    demoButton.addEventListener("click", () => {
        if (!messageInput) return;

        messageInput.value =
            "URGENT: Your account will be suspended. Verify your account immediately and enter your password using this link.";

        if ($("#charCount")) {
            $("#charCount").textContent =
                `${messageInput.value.length} / 3000`;
        }

        if (scanButton) scanButton.click();

        if ($("#labs")) {
            $("#labs").scrollIntoView({ behavior: "smooth" });
        }
    });
}


// ==========================================
// 6. PASSWORD STRENGTH LAB
// ==========================================

function checkPassword(password) {
    const checks = [
        ["At least 12 characters", password.length >= 12],
        [
            "Contains uppercase and lowercase letters",
            /[a-z]/.test(password) && /[A-Z]/.test(password)
        ],
        ["Contains a number", /\d/.test(password)],
        ["Contains a special character", /[^A-Za-z0-9]/.test(password)],
        [
            "Avoids common words or sequences",
            !/(password|qwerty|123456|letmein|admin)/i.test(password)
        ]
    ];

    let score = checks.filter(item => item[1]).length;

    if (password.length < 8) {
        score = Math.min(score, 1);
    }

    const labels = [
        "Very weak",
        "Weak",
        "Fair",
        "Good",
        "Strong",
        "Very strong"
    ];

    return {
        checks,
        score,
        label: password ? labels[Math.min(score, 5)] : "Not checked"
    };
}

const passwordInput = $("#passwordInput");

if (passwordInput) {
    passwordInput.addEventListener("input", e => {
        const password = e.target.value;
        const result = checkPassword(password);

        if ($("#strengthText")) {
            $("#strengthText").textContent = result.label;
        }

        if ($("#strengthBar")) {
            $("#strengthBar").style.width = `${result.score * 20}%`;

            $("#strengthBar").style.background =
                result.score < 2
                    ? "#ff6f86"
                    : result.score < 4
                        ? "#ffbf69"
                        : "#5df2b1";
        }

        const tips = $("#passwordTips");

        if (tips) {
            tips.replaceChildren();

            if (!password) {
                const li = document.createElement("li");
                li.textContent = "Enter a made-up password to see tips.";
                tips.appendChild(li);
            } else {
                result.checks.forEach(([label, ok]) => {
                    const li = document.createElement("li");
                    li.textContent = label;

                    if (ok) li.classList.add("good");

                    tips.appendChild(li);
                });
            }
        }
    });
}

const togglePassword = $("#togglePassword");

if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
        passwordInput.type =
            passwordInput.type === "password" ? "text" : "password";
    });
}

let passwordAwarded = false;

if (passwordInput) {
    passwordInput.addEventListener("change", () => {
        if (passwordInput.value && !passwordAwarded) {
            passwordAwarded = true;
            awardXP(10, "Password lab");
        }
    });
}


// ==========================================
// 7. CYBER TERMINAL
// ==========================================

const terminalOutput = $("#terminalOutput");

function terminalLine(text, className = "") {
    if (!terminalOutput) return;

    const p = document.createElement("p");
    p.textContent = text;

    if (className) {
        p.className = className;
    }

    terminalOutput.appendChild(p);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function runCommand(raw) {
    const command = raw.trim().toLowerCase();

    if (!command) return;

    terminalLine(`guest@cyberverse:~$ ${raw}`, "command-line");

    if (command === "clear") {
        if (terminalOutput) terminalOutput.replaceChildren();
        return;
    }

    const responses = {
        help: [
            "Available demo commands:",
            "help — show commands",
            "status — show simulator status",
            "scan demo — run a safe sample scan",
            "tips — display security tips",
            "whoami — show current demo user",
            "clear — clear terminal output"
        ],
        status: [
            "SIMULATOR: ONLINE",
            "MODE: LOCAL EDUCATIONAL DEMO",
            "NETWORK ACCESS: NOT USED",
            "THREAT FEED: SIMULATED DATA"
        ],
        tips: [
            "Never share passwords or OTPs.",
            "Use unique passwords and MFA.",
            "Check the real domain before signing in.",
            "Pause before responding to urgent requests."
        ],
        whoami: [
            "guest — CyberVerse training user",
            "Permission level: learner"
        ],
        "scan demo": [
            "Starting sample analysis...",
            "Sample indicators: urgent language + credential request",
            "DEMO RESULT: HIGH RISK — 65/100",
            "This is a preset simulation, not a real network scan."
        ]
    };

    const result = responses[command] || [
        "Unknown command. Type 'help' to see available commands."
    ];

    result.forEach((line, i) => {
        terminalLine(
            line,
            command === "scan demo" && i === 2
                ? "warning-line"
                : "success-line"
        );
    });

    if (command === "scan demo" || command === "tips") {
        awardXP(5, "Terminal exercise");
    }
}

const terminalForm = $("#terminalForm");

if (terminalForm) {
    terminalForm.addEventListener("submit", e => {
        e.preventDefault();

        const input = $("#terminalInput");
        if (!input) return;

        runCommand(input.value);
        input.value = "";
    });
}

document.querySelectorAll("[data-command]").forEach(button => {
    button.addEventListener("click", () => {
        runCommand(button.dataset.command);
    });
});


// ==========================================
// 8. CYBER SECURITY QUIZ
// ==========================================

function renderQuiz() {
    const questionElement = $("#quizQuestion");
    const optionsElement = $("#quizOptions");
    const feedbackElement = $("#quizFeedback");
    const nextButton = $("#nextQuestion");

    if (!questionElement || !optionsElement || !feedbackElement || !nextButton) {
        return;
    }

    const q = quiz[state.quizIndex];

    questionElement.textContent = q.question;
    feedbackElement.textContent = "";
    nextButton.classList.add("hidden");

    optionsElement.replaceChildren();

    q.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.textContent = option;
        button.dataset.answer = index;

        button.addEventListener("click", () => {
            const selected = index;

            optionsElement.querySelectorAll("button").forEach((b, i) => {
                b.disabled = true;

                if (i === q.answer) {
                    b.classList.add("correct");
                }

                if (i === selected && selected !== q.answer) {
                    b.classList.add("incorrect");
                }
            });

            const correct = selected === q.answer;

            feedbackElement.textContent = correct
                ? q.explanation
                : `Not quite. ${q.explanation}`;

            if (correct) {
                state.quizCorrect = true;
                awardXP(15, "Quiz question");
            }

            persist();
            renderStats();

            nextButton.textContent =
                state.quizIndex === quiz.length - 1
                    ? "Restart quiz ↻"
                    : "Next question →";

            nextButton.classList.remove("hidden");
        });

        optionsElement.appendChild(button);
    });
}

const nextQuestion = $("#nextQuestion");

if (nextQuestion) {
    nextQuestion.addEventListener("click", () => {
        state.quizIndex = (state.quizIndex + 1) % quiz.length;
        renderQuiz();
    });
}


// ==========================================
// 9. ACTIVITY FEED
// ==========================================

const activityFeed = $("#activity-feed");

function addActivity(iconText, titleText, descriptionText) {
    if (!activityFeed) return;

    const item = document.createElement("div");
    item.className = "activity-item";

    const icon = document.createElement("span");
    icon.className = "activity-icon";
    icon.textContent = iconText;

    const details = document.createElement("div");

    const title = document.createElement("strong");
    title.textContent = titleText;

    const description = document.createElement("p");
    description.textContent = descriptionText;

    const time = document.createElement("span");
    time.className = "activity-time";
    time.textContent = "JUST NOW";

    details.append(title, description);
    item.append(icon, details, time);

    activityFeed.prepend(item);

    while (activityFeed.children.length > 5) {
        activityFeed.lastElementChild.remove();
    }
}

function logMessageScan(result) {
    const risk = String(result.risk || "Low").toLowerCase();

    const icon =
        risk === "high" ? "🚨" :
        risk === "medium" ? "⚠️" : "🛡️";

    addActivity(
        icon,
        `${risk.toUpperCase()} risk message analyzed`,
        `Risk score: ${result.score}/100 · ${result.analysis_method || "Local analysis"}`
    );
}


// ==========================================
// 10. THREAT RADAR
// ==========================================

const radarScanBtn = $("#radar-scan-btn");
const radarMessage = $("#radar-message");
const threatCount = $("#threat-count");
const radarMap = $("#radar-map");

if (radarScanBtn && radarMessage && threatCount && radarMap) {
    radarScanBtn.addEventListener("click", () => {
        radarScanBtn.disabled = true;
        radarScanBtn.textContent = "⟳ Scanning...";
        radarMessage.textContent = "Running simulated radar scan...";

        radarMap.style.borderColor = "#00ffe1";

        setTimeout(() => {
            const demoThreats = Math.floor(Math.random() * 20) + 1;
            const currentCount = Number(threatCount.textContent) || 248;

            threatCount.textContent = String(
                currentCount + demoThreats
            ).padStart(4, "0");

            radarMessage.textContent =
                `Demo scan complete! ${demoThreats} simulated threat signals detected.`;

            addActivity(
                "📡",
                "Radar scan completed",
                `${demoThreats} simulated signals detected.`
            );

            radarScanBtn.textContent = "⟳ Run Radar Scan";
            radarScanBtn.disabled = false;

            radarMap.style.boxShadow =
                "0 0 22px rgba(0, 255, 225, 0.2)";

            setTimeout(() => {
                radarMap.style.boxShadow = "none";
            }, 1200);

        }, 1500);
    });
}


// ==========================================
// 11. SECURITY SCORE METER
// ==========================================

const scoreCheckBtn = $("#score-check-btn");
const securityScore = $("#security-score");
const scoreMeter = $("#score-meter");
const scoreStatus = $("#score-status");

if (scoreCheckBtn && securityScore && scoreMeter && scoreStatus) {
    scoreCheckBtn.addEventListener("click", () => {
        scoreCheckBtn.disabled = true;
        scoreCheckBtn.textContent = "Calculating...";

        // Educational demo score, not a real security assessment.
        const newScore = Math.floor(Math.random() * 31) + 70;

        securityScore.textContent = newScore;

        const degrees = newScore * 3.6;

        scoreMeter.style.background =
            `conic-gradient(#00ffe1 0deg ${degrees}deg, #203449 ${degrees}deg 360deg)`;

        if (newScore >= 90) {
            scoreStatus.textContent = "Demo status: Excellent";
            scoreStatus.style.color = "#65ff9a";
        } else if (newScore >= 80) {
            scoreStatus.textContent = "Demo status: Good";
            scoreStatus.style.color = "#00ffe1";
        } else {
            scoreStatus.textContent = "Demo status: Needs improvement";
            scoreStatus.style.color = "#ffbf69";
        }

        setTimeout(() => {
            scoreCheckBtn.disabled = false;
            scoreCheckBtn.textContent = "Recalculate Score ↻";
        }, 700);
    });
}


// ==========================================
// 12. SCAN HISTORY
// ==========================================

async function loadScanHistory() {
    const historyList = $("#historyList");

    if (!historyList) return;

    try {
        historyList.textContent = "Loading scan history...";

        const response = await fetch("/api/history");

        if (!response.ok) {
            throw new Error("Unable to load scan history");
        }

        const history = await response.json();
        renderAnalytics(history);

        const totalElement = $("#historyTotal");
        const highElement = $("#historyHigh");
        const mediumElement = $("#historyMedium");
        const lowElement = $("#historyLow");

        if (totalElement) totalElement.textContent = history.length;

        if (highElement) {
            highElement.textContent =
                history.filter(item => item.risk === "High").length;
        }

        if (mediumElement) {
            mediumElement.textContent =
                history.filter(item => item.risk === "Medium").length;
        }

        if (lowElement) {
            lowElement.textContent =
                history.filter(item => item.risk === "Low").length;
        }

        historyList.replaceChildren();

        if (history.length === 0) {
            historyList.textContent = "No scans found yet.";
            return;
        }

        history.forEach(item => {
            const card = document.createElement("div");
            card.className = "history-card";

            const heading = document.createElement("div");
            heading.className = "history-card-heading";

            const risk = document.createElement("span");
            risk.className = `risk-${String(item.risk).toLowerCase()}`;
            risk.textContent = item.risk;

            const score = document.createElement("strong");
            score.textContent = `${item.score}/100`;

            heading.append(risk, score);

            const message = document.createElement("p");
            message.textContent = item.message;

            const date = document.createElement("small");
            date.textContent = item.scanned_at;

            const detailsButton = document.createElement("button");
            detailsButton.className = "button secondary";
            detailsButton.textContent = "View Details";

            detailsButton.addEventListener("click", async () => {
                try {
                    const response = await fetch(`/api/history/${item.id}`);

                    const details = await response.json();

                    if (!response.ok) {
                        throw new Error(
                            details.error || "Could not load scan details"
                        );
                    }

                    const modal = $("#scanModal");
                    const modalDetails = $("#modalScanDetails");

                    if (!modal || !modalDetails) {
                        throw new Error("Scan details modal not found in HTML");
                    }

                    modalDetails.replaceChildren();

                    function addDetail(label, value) {
                        const section = document.createElement("div");
                        section.style.marginBottom = "18px";

                        const title = document.createElement("h3");
                        title.textContent = label;
                        title.style.color = "#42d9f5";

                        const content = document.createElement("p");
                        content.textContent = value ?? "Not available";

                        section.append(title, content);
                        modalDetails.appendChild(section);
                    }

                    addDetail("Risk Level", details.risk);
                    addDetail("Risk Score", `${details.score}/100`);
                    addDetail("Scanned Message", details.message);

                    addDetail(
                        "Warnings",
                        (details.warnings || []).join(" • ") || "No warnings"
                    );

                    addDetail("Safety Advice", details.advice);
                    addDetail("Scanned At", details.scanned_at);

                    modal.style.display = "flex";

                } catch (error) {
                    alert("Could not load scan details: " + error.message);
                    console.error(error);
                }
            });

            card.append(heading, message, date, detailsButton);
            historyList.appendChild(card);
        });

    } catch (error) {
        historyList.textContent = "Could not load scan history.";
        console.error(error);
    }
}


// ==========================================
// 13. REFRESH SCAN HISTORY
// ==========================================

const refreshHistory = $("#refreshHistory");

if (refreshHistory) {
    refreshHistory.addEventListener("click", loadScanHistory);
}


// ==========================================
// 14. DELETE SCAN HISTORY
// ==========================================

const deleteHistory = $("#deleteHistory");

if (deleteHistory) {
    deleteHistory.addEventListener("click", async () => {
        const confirmDelete = confirm(
            "Are you sure you want to delete all scan history?"
        );

        if (!confirmDelete) return;

        try {
            const response = await fetch("/api/history", {
                method: "DELETE"
            });

            if (!response.ok) {
                throw new Error("Delete failed");
            }

            alert("Scan history deleted successfully!");

            loadScanHistory();

        } catch (error) {
            alert("Could not delete scan history.");
            console.error(error);
        }
    });
}


// ==========================================
// 15. EXPORT SCAN REPORT
// ==========================================

const exportHistory = $("#exportHistory");

if (exportHistory) {
    exportHistory.addEventListener("click", () => {
        window.location.href = "/api/export";
    });
}


// ==========================================
// 16. CLOSE SCAN DETAILS MODAL
// ==========================================

const closeScanModal = $("#closeScanModal");
const scanModal = $("#scanModal");

if (closeScanModal && scanModal) {
    closeScanModal.addEventListener("click", () => {
        scanModal.style.display = "none";
    });
}

if (scanModal) {
    scanModal.addEventListener("click", event => {
        if (event.target === scanModal) {
            scanModal.style.display = "none";
        }
    });
}
// =====================================
// CYBERVERSE SCAN ANALYTICS
// =====================================

let riskChartInstance = null;
let activityChartInstance = null;

async function loadAnalytics() {
    try {
        const response = await fetch("/api/history");

        if (!response.ok) {
            throw new Error("Could not load scan history");
        }

        const history = await response.json();

        renderAnalytics(history);

    } catch (error) {
        console.error("Analytics error:", error);
    }
}

function renderAnalytics(history) {

    const riskCanvas = document.getElementById("riskChart");
    const activityCanvas = document.getElementById("activityChart");

    if (!riskCanvas || !activityCanvas || typeof Chart === "undefined") {
        return;
    }

    // Risk distribution
    const high = history.filter(item => item.risk === "High").length;
    const medium = history.filter(item => item.risk === "Medium").length;
    const low = history.filter(item => item.risk === "Low").length;

    if (riskChartInstance) {
        riskChartInstance.destroy();
    }

    riskChartInstance = new Chart(riskCanvas, {
        type: "doughnut",
        data: {
            labels: ["High Risk", "Medium Risk", "Low Risk"],
            datasets: [{
                data: [high, medium, low],
                backgroundColor: ["#ff4d6d", "#ffb84d", "#36d399"],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#ffffff",
                        padding: 20
                    }
                }
            }
        }
    });

    // Scan activity (last 7 days)
    const days = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        days.push({
            label: date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short"
            }),
            date: date.toLocaleDateString("en-CA"),
            count: 0
        });
    }

    history.forEach(item => {
        const scanDate = item.scanned_at?.split(" ")[0];

        const day = days.find(d => d.date === scanDate);

        if (day) {
            day.count++;
        }
    });

    if (activityChartInstance) {
        activityChartInstance.destroy();
    }

    activityChartInstance = new Chart(activityCanvas, {
        type: "bar",
        data: {
            labels: days.map(day => day.label),
            datasets: [{
                label: "Scans",
                data: days.map(day => day.count),
                backgroundColor: "#8b5cf6",
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: "#ffffff"
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: "#ffffff" },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: "#ffffff",
                        precision: 0
                    }
                }
            }
        }
    });
}




// ==========================================
// 17. INITIALIZE APP
// ==========================================

renderStats();
renderQuiz();
loadScanHistory();

// =====================================
// URL SECURITY SCANNER
// =====================================

const urlInput = document.getElementById("urlInput");
const urlBtn = document.getElementById("urlBtn");
const urlResult = document.getElementById("urlResult");

if (urlBtn && urlInput && urlResult) {
    urlBtn.addEventListener("click", async () => {
        const url = urlInput.value.trim();

        if (!url) {
            urlResult.classList.remove("hidden");
            urlResult.textContent = "Please enter a URL first.";
            return;
        }

        urlBtn.disabled = true;
        urlBtn.textContent = "Scanning...";

        urlResult.classList.remove("hidden");
        urlResult.textContent = "Analyzing URL...";

        try {
            const response = await fetch("/api/scan-url", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ url: url })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "URL scan failed.");
            }

            urlResult.replaceChildren();

            const heading = document.createElement("h3");
            heading.textContent = `${data.risk} Risk — ${data.score}/100`;

            const scannedUrl = document.createElement("p");
            scannedUrl.textContent = `Scanned URL: ${data.url}`;

            const warningsTitle = document.createElement("strong");
            warningsTitle.textContent = "Warnings:";

            const warningList = document.createElement("ul");

            if (data.warnings.length > 0) {
                data.warnings.forEach(warning => {
                    const item = document.createElement("li");
                    item.textContent = warning;
                    warningList.appendChild(item);
                });
            } else {
                const item = document.createElement("li");
                item.textContent = "No common warning signs detected.";
                warningList.appendChild(item);
            }

            const advice = document.createElement("p");
            advice.textContent = data.advice;

            urlResult.append(
                heading,
                scannedUrl,
                warningsTitle,
                warningList,
                advice
            );

        } catch (error) {
            urlResult.textContent = error.message;
        } finally {
            urlBtn.disabled = false;
            urlBtn.textContent = "Scan URL →";
        }
    });
}