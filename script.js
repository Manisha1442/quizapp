// Get DOM elements
const loginScreen = document.getElementById("loginScreen");
const usernameInput = document.getElementById("usernameInput");
const startBtn = document.getElementById("startBtn");

const configScreen = document.getElementById("configScreen");
const categorySelect = document.getElementById("categorySelect");
const questionCountSelect = document.getElementById("questionCountSelect");
const beginQuizBtn = document.getElementById("beginQuizBtn");
const logoutBtn = document.getElementById("logoutBtn");

const quizScreen = document.getElementById("quizScreen");
const timerDisplay = document.getElementById("timeLeft");
const progressBar = document.getElementById("progressBar");
const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const submitBtn = document.getElementById("submitBtn");

const resultScreen = document.getElementById("resultScreen");
const scoreDisplay = document.getElementById("scoreDisplay");
const reviewQuizBtn = document.getElementById("reviewQuizBtn");
const restartBtn = document.getElementById("restartBtn");
const logoutBtn2 = document.getElementById("logoutBtn2");
const highScoresList = document.getElementById("highScoresList");
const answerReview = document.getElementById("answerReview");
const displayUsername = document.getElementById("displayUsername");
const toggleHighScoresBtn = document.getElementById("toggleHighScoresBtn");
// Variables to keep state
let currentUser = null;
let currentCategory = null;
let questionCount = 0;
let selectedQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let timer = null;
const timePerQuestion = 15;
let timeLeft = timePerQuestion;
let score = 0;

// Populate categories dropdown
function populateCategories() {
  categorySelect.innerHTML = `<option value="" disabled selected>Select category</option>`;
  Object.keys(allQuestions).forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

// Show only one screen
function showScreen(screen) {
  [loginScreen, configScreen, quizScreen, resultScreen].forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

// Shuffle helper (Fisher-Yates)
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Start quiz after login
startBtn.addEventListener("click", () => {
  const username = usernameInput.value.trim();
  if (!username) {
    alert("Please enter username");
    return;
  }
  currentUser = username;
  localStorage.setItem("quizUser", currentUser);
  displayUsername.textContent = currentUser;
  populateCategories();
  resetQuiz();
  showScreen(configScreen);
});

// On load, check if user logged in
window.addEventListener("load", () => {
  const savedUser = localStorage.getItem("quizUser");
  if (savedUser) {
    currentUser = savedUser;
    displayUsername.textContent = currentUser;
    populateCategories();
    resetQuiz();
    showScreen(configScreen);
  } else {
    showScreen(loginScreen);
  }
});

// Logout handlers
logoutBtn.addEventListener("click", logoutUser);
logoutBtn2.addEventListener("click", logoutUser);

function logoutUser() {
  localStorage.removeItem("quizUser");
  currentUser = null;
  resetQuiz();
  showScreen(loginScreen);
}

// Reset quiz state
function resetQuiz() {
  selectedQuestions = [];
  userAnswers = [];
  currentQuestionIndex = 0;
  score = 0;
  submitBtn.style.display = "none";
  reviewQuizBtn.style.display = "none";
  answerReview.style.display = "none";
  answerReview.innerHTML = "";
  timerDisplay.textContent = "";
  progressBar.style.width = "0%";
}

// Begin quiz button clicked on config screen
beginQuizBtn.addEventListener("click", () => {
  const cat = categorySelect.value;
  const qCount = parseInt(questionCountSelect.value);

  if (!cat) {
    alert("Please select a category");
    return;
  }
  if (!qCount) {
    alert("Please select number of questions");
    return;
  }

  currentCategory = cat;
  questionCount = qCount;

  // Prepare questions: shuffle and slice by questionCount
  selectedQuestions = shuffleArray(allQuestions[cat].slice()).slice(0, questionCount);
  userAnswers = new Array(selectedQuestions.length).fill(null);
  currentQuestionIndex = 0;

  loadQuestion();
  showScreen(quizScreen);
});

// Timer management
function startTimer() {
  timeLeft = timePerQuestion;
  timerDisplay.textContent = timeLeft;
  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      if (userAnswers[currentQuestionIndex] == null) {
        userAnswers[currentQuestionIndex] = null; // explicitly mark unanswered
      }
      nextQuestion();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
}

// Load question and options to quiz screen
function loadQuestion() {
  if (currentQuestionIndex >= selectedQuestions.length) {
    // End of quiz, show submit button
    questionText.textContent = `You answered all ${selectedQuestions.length} questions. Click Submit to finish.`;
    optionsContainer.innerHTML = "";
    submitBtn.style.display = "inline-block";
    stopTimer();
    progressBar.style.width = "100%";
    timerDisplay.textContent = "";
    return;
  }

  const q = selectedQuestions[currentQuestionIndex];
  questionText.textContent = `Q${currentQuestionIndex + 1}: ${q.question}`;
  optionsContainer.innerHTML = "";
  submitBtn.style.display = "none";

  q.answers.forEach((answerText, idx) => {
    const btn = document.createElement("button");
    btn.textContent = answerText;
    btn.className = "option-btn";
    if (userAnswers[currentQuestionIndex] === idx) {
      btn.classList.add("selected");
    }
    btn.addEventListener("click", () => {
      userAnswers[currentQuestionIndex] = idx;
      // Highlight selected
      Array.from(optionsContainer.children).forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");

      stopTimer();

      currentQuestionIndex++;
      loadQuestion();
    });
    optionsContainer.appendChild(btn);
  });

  // Update progress bar
  const progressPercent = (currentQuestionIndex / selectedQuestions.length) * 100;
  progressBar.style.width = progressPercent + "%";

  startTimer();
}

// Move to next question when timer ends without answer
function nextQuestion() {
  currentQuestionIndex++;
  loadQuestion();
}

// Submit quiz button handler
submitBtn.addEventListener("click", () => {
  stopTimer();
  // Calculate score
  score = 0;
  for (let i = 0; i < selectedQuestions.length; i++) {
    if (userAnswers[i] === selectedQuestions[i].correct) {
      score++;
    }
  }

  scoreDisplay.textContent = `You scored ${score} out of ${selectedQuestions.length}`;

  saveHighScore(currentUser, score);

  displayHighScores();

  reviewQuizBtn.style.display = "inline-block";

  showScreen(resultScreen);
});

// Review answers button handler
reviewQuizBtn.addEventListener("click", () => {
  answerReview.style.display = "block";
  answerReview.innerHTML = "";

  selectedQuestions.forEach((q, idx) => {
    const div = document.createElement("div");
    div.classList.add("review-question");

    const qText = document.createElement("p");
    qText.textContent = `Q${idx + 1}: ${q.question}`;
    div.appendChild(qText);

    const userAnswerIndex = userAnswers[idx];
    const correctAnswerIndex = q.correct;

    q.answers.forEach((ans, i) => {
      const ansP = document.createElement("p");
      ansP.textContent = ans;
      if (i === correctAnswerIndex) {
        ansP.style.color = "green";
        ansP.style.fontWeight = "bold";
      }
      if (i === userAnswerIndex && userAnswerIndex !== correctAnswerIndex) {
        ansP.style.color = "red";
        ansP.style.textDecoration = "line-through";
      }
      div.appendChild(ansP);
    });

    answerReview.appendChild(div);
  });

  reviewQuizBtn.style.display = "none";
});

// Restart quiz button handler
restartBtn.addEventListener("click", () => {
  resetQuiz();
  populateCategories();
  showScreen(configScreen);
});

// High scores management
function saveHighScore(user, score) {
  let highScores = JSON.parse(localStorage.getItem("quizHighScores")) || [];
  highScores.push({ user, score, date: new Date().toISOString() });
  // Keep only top 10 scores sorted descending
  highScores = highScores.sort((a, b) => b.score - a.score).slice(0, 10);
  localStorage.setItem("quizHighScores", JSON.stringify(highScores));
}

function displayHighScores() {
  let highScores = JSON.parse(localStorage.getItem("quizHighScores")) || [];
  highScoresList.innerHTML = "";

  if (highScores.length === 0) {
    highScoresList.textContent = "No high scores yet.";
    return;
  }

  highScores.forEach((entry, idx) => {
    const li = document.createElement("li");
    li.textContent = `${idx + 1}. ${entry.user} - ${entry.score} (${new Date(entry.date).toLocaleDateString()})`;
    highScoresList.appendChild(li);
  });
}


toggleHighScoresBtn.addEventListener("click", () => {
  if (highScoresList.style.display === "none") {
    highScoresList.style.display = "block";
    toggleHighScoresBtn.textContent = "Hide High Scores";
  } else {
    highScoresList.style.display = "none";
    toggleHighScoresBtn.textContent = "View High Scores";
  }
});
