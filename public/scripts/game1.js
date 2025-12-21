const questions = [
    { q: "What is the output of: print(2 ** 3)?", options: ["6", "8", "9", "Error"], answer: 1 },
    { q: "Which keyword is used to define a function in Python?", options: ["function", "define", "def", "fun"], answer: 2 },
    { q: "What is the correct file extension for Python?", options: [".pt", ".py", ".python", ".p"], answer: 1 },
    { q: "What does len('hello') return?", options: ["4", "5", "6", "Error"], answer: 1 },
    { q: "Which collection is ordered and mutable?", options: ["tuple", "list", "set", "dict"], answer: 1 },
    { q: "How do you start a comment in Python?", options: ["//", "<!-- -->", "#", "/* */"], answer: 2 },
    { q: "What is the output of print(type(3.0))?", options: ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'bool'>"], answer: 1 },
    { q: "Which keyword exits a loop early?", options: ["exit", "stop", "break", "quit"], answer: 2 },
    { q: "Select the correct boolean operators.", options: ["and / or / not", "plus / minus", "if / else", "greater / less"], answer: 0 },
    { q: "What does list.append(x) do?", options: ["Adds x to end", "Adds x to start", "Removes x", "Copies list"], answer: 0 },
    { q: "How to open a file for reading?", options: ["open('file', 'r')", "open('file', 'w')", "read('file')", "file.open()"], answer: 0 },
    { q: "What is the output of bool('')?", options: ["True", "False", "0", "Error"], answer: 1 },
    { q: "Which loop guarantees at least one run?", options: ["for", "while", "do-while", "None"], answer: 3 },
    { q: "PEP 8 refers to?", options: ["Style guide", "Loop type", "Data type", "Package"], answer: 0 },
    { q: "What is a virtual environment for?", options: ["Game dev", "Isolating deps", "Speeding CPU", "Compiling"], answer: 1 },
    { q: "Which built-in converts to int?", options: ["toInt()", "int()", "cast()", "number()"], answer: 1 },
    { q: "How to format with f-strings?", options: ["f'{name}'", "format(name)", "'%s' % name", "concat(name)"], answer: 0 },
    { q: "What does range(3) produce?", options: ["1,2,3", "0,1,2", "0,1,2,3", "2,3,4"], answer: 1 },
    { q: "Pick an immutable type.", options: ["list", "dict", "set", "tuple"], answer: 3 },
    { q: "What does pass keyword do?", options: ["Skip placeholder", "Stop loop", "Throw error", "Import"], answer: 0 },
];

let current = 0;
let score = 0;
let lives = 3;

const questionEl = document.getElementById("question");
const optionBtns = Array.from(document.querySelectorAll(".options button"));
const feedbackEl = document.getElementById("feedback");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const levelEl = document.getElementById("level");
const currentIdxEl = document.getElementById("currentIdx");
const totalEl = document.getElementById("total");
const progressBar = document.getElementById("progressBar");
const nextBtn = document.getElementById("nextBtn");
const resetBtn = document.getElementById("resetBtn");

totalEl.textContent = questions.length;

function updateProgress() {
    const pct = ((current + 1) / questions.length) * 100;
    progressBar.style.width = `${pct}%`;
    currentIdxEl.textContent = current + 1;
    levelEl.textContent = current + 1;
}

function loadQuestion() {
    const q = questions[current];
    questionEl.textContent = q.q;
    optionBtns.forEach((btn, idx) => {
        btn.textContent = q.options[idx];
        btn.disabled = false;
        btn.classList.remove("correct", "wrong");
    });
    feedbackEl.textContent = "Pick the best answer to squash the bug.";
    updateProgress();
}

function lockOptions() {
    optionBtns.forEach((btn) => (btn.disabled = true));
}

function checkAnswer(selected) {
    const q = questions[current];
    if (selected === q.answer) {
        score += 10;
        feedbackEl.textContent = "✅ Correct! Bug fixed.";
        optionBtns[selected].classList.add("correct");
    } else {
        lives -= 1;
        feedbackEl.textContent = `❌ Wrong. Correct answer: ${q.options[q.answer]}`;
        optionBtns[selected].classList.add("wrong");
        optionBtns[q.answer].classList.add("correct");
    }

    lockOptions();
    scoreEl.textContent = score;
    livesEl.textContent = lives;

    if (lives <= 0) {
        feedbackEl.textContent = `💀 Game over. Final score: ${score}. Restart to try again.`;
        nextBtn.disabled = true;
    } else {
        nextBtn.disabled = false;
    }
}

function nextQuestion() {
    if (lives <= 0) return;
    current++;
    if (current >= questions.length) {
        feedbackEl.textContent = `🏆 You finished all levels! Final score: ${score}.`;
        lockOptions();
        nextBtn.disabled = true;
        return;
    }
    nextBtn.disabled = true;
    loadQuestion();
}

function resetGame() {
    current = 0;
    score = 0;
    lives = 3;
    nextBtn.disabled = true;
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    loadQuestion();
    optionBtns.forEach((btn) => (btn.disabled = false));
}

optionBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
        const idx = Number(e.currentTarget.getAttribute("data-index"));
        checkAnswer(idx);
    });
});

nextBtn.addEventListener("click", nextQuestion);
resetBtn.addEventListener("click", resetGame);

nextBtn.disabled = true;
loadQuestion();