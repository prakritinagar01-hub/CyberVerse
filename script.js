const $ = (selector) => document.querySelector(selector);
const state = { xp: 0, completed: 0, messages: 0, quizCorrect: false, quizIndex: 0 };
const quiz = [
  { question: "What should you do if an unexpected email asks you to verify your password using a link?", options: ["Click quickly before the account closes", "Avoid the link and verify through the official website or app", "Forward it to all your friends"], answer: 1, explanation: "Correct! Use a trusted route to the service instead of an unexpected link." },
  { question: "Which is the safest way to handle a one-time password (OTP)?", options: ["Share it with a caller who says they are support", "Post it in a group for help", "Never share it with anyone"], answer: 2, explanation: "Correct! Legitimate support should not ask you to reveal your OTP." },
  { question: "A message says you won a prize you never entered to win. What is a warning sign?", options: ["It asks you to click a link urgently", "It has a greeting", "It arrived in the morning"], answer: 0, explanation: "Correct! Unexpected rewards and urgent links are common scam signals." },
  { question: "What helps make an account safer?", options: ["Reuse one password everywhere", "Use unique passwords and enable MFA", "Use your birthday as a password"], answer: 1, explanation: "Correct! Unique passwords and multi-factor authentication improve account security." }
];
const saved = (() => { try { return JSON.parse(localStorage.getItem("cyberverse-progress")) || {}; } catch { return {}; } })();
state.xp = Number(saved.xp) || 0;
state.completed = Number(saved.completed) || 0;
state.messages = Number(saved.messages) || 0;
state.quizCorrect = Boolean(saved.quizCorrect);

function persist() {
  localStorage.setItem("cyberverse-progress", JSON.stringify({ xp: state.xp, completed: state.completed, messages: state.messages, quizCorrect: state.quizCorrect }));
}
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2600);
}
function awardXP(amount, labName) {
  state.xp += amount;
  state.completed += 1;
  persist(); renderStats();
  toast(`+${amount} XP earned · ${labName} completed`);
}
function renderStats() {
  const level = Math.floor(state.xp / 100) + 1;
  const progress = state.xp % 100;
  const badgeCount = Number(state.completed >= 1) + Number(state.messages >= 3) + Number(state.quizCorrect);
  $("#totalXP").textContent = state.xp;
  $("#heroXP").textContent = `${state.xp} XP`;
  $("#heroScans").textContent = state.completed;
  $("#completed").textContent = state.completed;
  $("#level").textContent = level;
  $("#nextLevel").textContent = `${100 - progress} XP to next level`;
  $("#badges").textContent = badgeCount;
  $("#badgeHint").textContent = badgeCount ? "Keep collecting badges" : "Your first badge awaits";
  $("#progressLabel").textContent = `${progress} / 100 XP`;
  $("#progressBar").style.width = `${progress}%`;
  $("#badgeFirst").classList.toggle("unlocked", state.completed >= 1);
  $("#badgeAnalyst").classList.toggle("unlocked", state.messages >= 3);
  $("#badgeScholar").classList.toggle("unlocked", state.quizCorrect);
  document.querySelectorAll(".achievement").forEach(el => {
    el.querySelector(".achievement-state").textContent = el.classList.contains("unlocked") ? "UNLOCKED" : "LOCKED";
  });
}
function analyseMessage(text) {
  const checks = [
    { pattern: /\b(urgent|immediately|act now|within 24 hours|right away)\b/i, points: 20, warning: "Urgent or pressuring language" },
    { pattern: /\b(password|otp|one[- ]time passcode|pin)\b/i, points: 25, warning: "Requests or mentions sensitive credentials" },
    { pattern: /\b(click here|verify (your )?account|login now|reset your account)\b/i, points: 25, warning: "Call to action that may lead to a fake login page" },
    { pattern: /\b(won a prize|claim (your )?(reward|gift)|free gift|lottery winner)\b/i, points: 20, warning: "Unexpected prize or reward language" },
    { pattern: /\b(suspended|locked|limited access|account will close)\b/i, points: 15, warning: "Threat of account suspension or loss of access" },
    { pattern: /\b(gift card|wire transfer|crypto payment|send money)\b/i, points: 15, warning: "Unusual payment request" }
  ];
  const warnings = checks.filter(check => check.pattern.test(text)).map(check => check.warning);
  const score = Math.min(100, checks.filter(check => check.pattern.test(text)).reduce((sum, check) => sum + check.points, 0));
  const risk = score >= 50 ? "High" : score >= 25 ? "Medium" : "Low";
  return { score, risk, warnings };
}
$("#messageInput").addEventListener("input", e => $("#charCount").textContent = `${e.target.value.length} / 3000`);
$("#scanButton").addEventListener("click", () => {
  const message = $("#messageInput").value.trim();
  if (!message) { toast("Paste a message first to run the analysis."); $("#messageInput").focus(); return; }
  const result = analyseMessage(message);
  state.messages += 1;
  const box = $("#messageResult");
  box.classList.remove("hidden");
  box.innerHTML = `<h4>Risk estimate: <span class="risk-${result.risk.toLowerCase()}">${result.risk.toUpperCase()}</span> · ${result.score}/100</h4>
    <p>${result.score >= 50 ? "Several warning signs found. Do not click links or share sensitive information until independently verified." : result.score >= 25 ? "Some warning signs found. Verify the sender and destination through a trusted channel." : "Few common warning signs detected, but this does not prove the message is safe."}</p>
    ${result.warnings.length ? `<ul>${result.warnings.map(w => `<li>${w}</li>`).join("")}</ul>` : "<p>No common keyword signals found by this simple demo.</p>"}
    <p style="margin-top:8px;color:#7485a9;font-size:.67rem">Heuristic demo only. It cannot verify senders, links, or attachments.</p>`;
  awardXP(20, "Message scan");
});
$("#demoButton").addEventListener("click", () => {
  $("#messageInput").value = "URGENT: Your account will be suspended. Verify your account immediately and enter your password using this link.";
  $("#charCount").textContent = `${$("#messageInput").value.length} / 3000`;
  $("#scanButton").click();
  $("#labs").scrollIntoView({ behavior: "smooth" });
});

function checkPassword(password) {
  const checks = [
    ["At least 12 characters", password.length >= 12],
    ["Contains uppercase and lowercase letters", /[a-z]/.test(password) && /[A-Z]/.test(password)],
    ["Contains a number", /\d/.test(password)],
    ["Contains a special character", /[^A-Za-z0-9]/.test(password)],
    ["Avoids common words or sequences", !/(password|qwerty|123456|letmein|admin)/i.test(password)]
  ];
  let score = checks.filter(item => item[1]).length;
  if (password.length < 8) score = Math.min(score, 1);
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong", "Very strong"];
  return { checks, score, label: password ? labels[Math.min(score, 5)] : "Not checked" };
}
$("#passwordInput").addEventListener("input", e => {
  const password = e.target.value;
  const result = checkPassword(password);
  $("#strengthText").textContent = result.label;
  $("#strengthBar").style.width = `${result.score * 20}%`;
  $("#strengthBar").style.background = result.score < 2 ? "#ff6f86" : result.score < 4 ? "#ffbf69" : "#5df2b1";
  $("#passwordTips").innerHTML = password ? result.checks.map(([label, ok]) => `<li class="${ok ? "good" : ""}">${label}</li>`).join("") : "<li>Enter a made-up password to see tips.</li>";
});
$("#togglePassword").addEventListener("click", () => {
  const input = $("#passwordInput");
  input.type = input.type === "password" ? "text" : "password";
});
let passwordAwarded = false;
$("#passwordInput").addEventListener("change", () => {
  if ($("#passwordInput").value && !passwordAwarded) { passwordAwarded = true; awardXP(10, "Password lab"); }
});

const terminalOutput = $("#terminalOutput");
function terminalLine(text, className = "") {
  const p = document.createElement("p");
  p.textContent = text;
  if (className) p.className = className;
  terminalOutput.appendChild(p);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}
function runCommand(raw) {
  const command = raw.trim().toLowerCase();
  if (!command) return;
  terminalLine(`guest@cyberverse:~$ ${raw}`, "command-line");
  if (command === "clear") { terminalOutput.innerHTML = ""; return; }
  const responses = {
    help: ["Available demo commands:", "help — show commands", "status — show simulator status", "scan demo — run a safe sample scan", "tips — display security tips", "whoami — show current demo user", "clear — clear terminal output"],
    status: ["SIMULATOR: ONLINE", "MODE: LOCAL EDUCATIONAL DEMO", "NETWORK ACCESS: NOT USED", "THREAT FEED: SIMULATED DATA"],
    tips: ["Never share passwords or OTPs.", "Use unique passwords and MFA.", "Check the real domain before signing in.", "Pause before responding to urgent requests."],
    whoami: ["guest — CyberVerse training user", "Permission level: learner"],
    "scan demo": ["Starting sample analysis...", "Sample indicators: urgent language + credential request", "DEMO RESULT: HIGH RISK — 65/100", "This is a preset simulation, not a real network scan."]
  };
  (responses[command] || ["Unknown command. Type 'help' to see available commands."]).forEach((line, i) => terminalLine(line, command === "scan demo" && i === 2 ? "warning-line" : "success-line"));
  if (command === "scan demo" || command === "tips") awardXP(5, "Terminal exercise");
}
$("#terminalForm").addEventListener("submit", e => { e.preventDefault(); runCommand($("#terminalInput").value); $("#terminalInput").value = ""; });
document.querySelectorAll("[data-command]").forEach(button => button.addEventListener("click", () => runCommand(button.dataset.command)));

function renderQuiz() {
  const q = quiz[state.quizIndex];
  $("#quizQuestion").textContent = q.question;
  $("#quizFeedback").textContent = "";
  $("#nextQuestion").classList.add("hidden");
  $("#quizOptions").innerHTML = q.options.map((option, index) => `<button data-answer="${index}">${option}</button>`).join("");
  $("#quizOptions").querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
    const selected = Number(button.dataset.answer);
    $("#quizOptions").querySelectorAll("button").forEach((b, i) => {
      b.disabled = true;
      if (i === q.answer) b.classList.add("correct");
      if (i === selected && selected !== q.answer) b.classList.add("incorrect");
    });
    const correct = selected === q.answer;
    $("#quizFeedback").textContent = correct ? q.explanation : `Not quite. ${q.explanation}`;
    if (correct) {
      state.quizCorrect = true;
      awardXP(15, "Quiz question");
    }
    persist(); renderStats();
    $("#nextQuestion").textContent = state.quizIndex === quiz.length - 1 ? "Restart quiz ↻" : "Next question →";
    $("#nextQuestion").classList.remove("hidden");
  }));
}
$("#nextQuestion").addEventListener("click", () => { state.quizIndex = (state.quizIndex + 1) % quiz.length; renderQuiz(); });
renderStats();
renderQuiz();
