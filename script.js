// kanjiData and categories are loaded from kanji-data.js
let currentQuestion = 0;
let score = 0;
let shuffledQuestions = [];
let correctAnswers = 0;
let incorrectAnswers = 0;
let currentStreak = 0;
let bestStreak = 0;
let wrongKanji = [];
let selectedCategory = 'all';
let selectedQuizMode = 'medium';
let customQuestionCount = 10;

// Lifeline states
let lifelines = {
    fiftyFifty: { available: true, used: false },
    skip: { available: true, used: false },
    hint: { available: true, used: false }
};

// ============= CATEGORY SELECTION =============

function initCategoryScreen() {
    const categoryGrid = document.getElementById('category-grid');
    categoryGrid.innerHTML = '';
    
    for (const [key, cat] of Object.entries(categories)) {
        const count = key === 'all' ? kanjiData.length : kanjiData.filter(k => k.category === key).length;
        
        const card = document.createElement('div');
        card.className = 'category-card';
        card.onclick = () => selectCategory(key);
        
        card.innerHTML = `
            <div class="category-emoji">${cat.emoji}</div>
            <div class="category-name">${cat.name}</div>
            <div class="category-description">${cat.description}</div>
            <div class="category-count">${count} kanji available</div>
        `;
        
        categoryGrid.appendChild(card);
    }
}

function selectCategory(category) {
    selectedCategory = category;
    document.getElementById('category-screen').style.display = 'none';
    showQuizModeScreen();
}

// ============= QUIZ MODE SELECTION =============

function showQuizModeScreen() {
    let modeScreen = document.getElementById('quiz-mode-screen');
    if (!modeScreen) {
        modeScreen = document.createElement('div');
        modeScreen.id = 'quiz-mode-screen';
        document.querySelector('.container').appendChild(modeScreen);
    }
    
    const filteredKanji = selectedCategory === 'all' 
        ? kanjiData 
        : kanjiData.filter(k => k.category === selectedCategory);
    const availableCount = filteredKanji.length;
    
    const modes = [
        { id: 'easy', name: 'Easy', emoji: '😊', questions: 5, description: '5 questions' },
        { id: 'medium', name: 'Medium', emoji: '🤔', questions: 10, description: '10 questions' },
        { id: 'hard', name: 'Hard', emoji: '😰', questions: 20, description: '20 questions' },
        { id: 'custom', name: 'Custom', emoji: '⚙️', questions: 0, description: 'Choose amount' }
    ];
    
    let modeCards = '';
    modes.forEach(mode => {
        const isAvailable = mode.id === 'custom' || mode.questions <= availableCount;
        if (isAvailable) {
            modeCards += `
                <div class="mode-card" onclick="selectQuizMode('${mode.id}', ${availableCount})">
                    <div class="mode-emoji">${mode.emoji}</div>
                    <div class="mode-name">${mode.name}</div>
                    <div class="mode-description">${mode.description}</div>
                </div>
            `;
        }
    });
    
    modeScreen.innerHTML = `
        <h2 class="category-title">Select Difficulty</h2>
        <div class="mode-grid">
            ${modeCards}
        </div>
        <button class="btn back-btn" onclick="backToCategories()">← Back to Categories</button>
    `;
    
    modeScreen.style.display = 'block';
}

function selectQuizMode(mode, availableCount) {
    selectedQuizMode = mode;
    
    if (mode === 'custom') {
        showCustomModeInput(availableCount);
    } else {
        document.getElementById('quiz-mode-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';
        initGame();
    }
}

function showCustomModeInput(availableCount) {
    const modeScreen = document.getElementById('quiz-mode-screen');
    modeScreen.innerHTML = `
        <h2 class="category-title">Custom Mode</h2>
        <div class="custom-mode-container">
            <p>Available kanji: <strong>${availableCount}</strong></p>
            <label for="question-count">How many questions?</label>
            <input type="number" id="question-count" min="1" max="${availableCount}" value="${Math.min(10, availableCount)}">
            <div class="custom-buttons">
                <button class="btn" onclick="startCustomMode()">Start Quiz</button>
                <button class="btn back-btn" onclick="showQuizModeScreen()">← Back</button>
            </div>
        </div>
    `;
}

function startCustomMode() {
    const input = document.getElementById('question-count');
    customQuestionCount = parseInt(input.value);
    
    document.getElementById('quiz-mode-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    initGame();
}

function backToCategories() {
    document.getElementById('quiz-mode-screen').style.display = 'none';
    document.getElementById('category-screen').style.display = 'block';
}

// ============= GAME LOGIC =============

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function initGame() {
    const filteredKanji = selectedCategory === 'all' 
        ? kanjiData 
        : kanjiData.filter(k => k.category === selectedCategory);
    
    let questionCount;
    if (selectedQuizMode === 'easy') {
        questionCount = 5;
    } else if (selectedQuizMode === 'medium') {
        questionCount = 10;
    } else if (selectedQuizMode === 'hard') {
        questionCount = 20;
    } else if (selectedQuizMode === 'custom') {
        questionCount = customQuestionCount;
    }
    
    questionCount = Math.min(questionCount, filteredKanji.length);
    
    shuffledQuestions = shuffleArray(filteredKanji).slice(0, questionCount);
    currentQuestion = 0;
    score = 0;
    correctAnswers = 0;
    incorrectAnswers = 0;
    currentStreak = 0;
    bestStreak = 0;
    wrongKanji = [];
    
    lifelines = {
        fiftyFifty: { available: true, used: false },
        skip: { available: true, used: false },
        hint: { available: true, used: false }
    };
    
    displayQuestion();
}

function displayQuestion() {
    if (currentQuestion >= shuffledQuestions.length) {
        showResults();
        return;
    }

    const question = shuffledQuestions[currentQuestion];
    document.getElementById('kanji-display').textContent = question.kanji;
    document.getElementById('current').textContent = currentQuestion + 1;
    document.getElementById('total').textContent = shuffledQuestions.length;
    document.getElementById('score').textContent = score;

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    const shuffledOptions = shuffleArray(question.options);
    
    shuffledOptions.forEach(option => {
        const button = document.createElement('div');
        button.className = 'option';
        button.textContent = option;
        button.onclick = () => checkAnswer(option, question.correct, button);
        optionsContainer.appendChild(button);
    });

    document.getElementById('next-btn').style.display = 'none';
    
    updateLifelineButtons();
    
    const existingHint = document.querySelector('.hint-message');
    if (existingHint) existingHint.remove();
}

function checkAnswer(selected, correct, button) {
    const question = shuffledQuestions[currentQuestion];
    const options = document.querySelectorAll('.option');
    options.forEach(opt => {
        opt.classList.add('disabled');
        opt.onclick = null;
        if (opt.textContent === correct) {
            opt.classList.add('correct');
        }
    });

    if (selected === correct) {
        button.classList.add('correct');
        score++;
        correctAnswers++;
        currentStreak++;
        if (currentStreak > bestStreak) {
            bestStreak = currentStreak;
        }
        document.getElementById('score').textContent = score;
    } else {
        button.classList.add('wrong');
        incorrectAnswers++;
        currentStreak = 0;
        wrongKanji.push({
            kanji: question.kanji,
            correct: correct,
            selected: selected
        });
    }

    document.getElementById('next-btn').style.display = 'block';
}

document.getElementById('next-btn').onclick = () => {
    currentQuestion++;
    displayQuestion();
};

// ============= LIFELINE FUNCTIONS =============

function updateLifelineButtons() {
    const fiftyBtn = document.getElementById('fifty-fifty-btn');
    const skipBtn = document.getElementById('skip-btn');
    const hintBtn = document.getElementById('hint-btn');
    
    if (fiftyBtn) {
        fiftyBtn.className = lifelines.fiftyFifty.used ? 'lifeline-btn used' : 'lifeline-btn';
        fiftyBtn.disabled = lifelines.fiftyFifty.used;
    }
    if (skipBtn) {
        skipBtn.className = lifelines.skip.used ? 'lifeline-btn used' : 'lifeline-btn';
        skipBtn.disabled = lifelines.skip.used;
    }
    if (hintBtn) {
        hintBtn.className = lifelines.hint.used ? 'lifeline-btn used' : 'lifeline-btn';
        hintBtn.disabled = lifelines.hint.used;
    }
}

function useFiftyFifty() {
    if (lifelines.fiftyFifty.used) return;
    
    const question = shuffledQuestions[currentQuestion];
    const options = document.querySelectorAll('.option');
    const correctAnswer = question.correct;
    
    const wrongOptions = Array.from(options).filter(opt => 
        opt.textContent !== correctAnswer && 
        !opt.classList.contains('disabled')
    );
    
    const toRemove = shuffleArray(wrongOptions).slice(0, 2);
    toRemove.forEach(opt => {
        opt.style.opacity = '0.3';
        opt.style.pointerEvents = 'none';
        opt.classList.add('disabled');
    });
    
    lifelines.fiftyFifty.used = true;
    updateLifelineButtons();
}

function useSkip() {
    if (lifelines.skip.used) return;
    
    lifelines.skip.used = true;
    updateLifelineButtons();
    
    currentQuestion++;
    displayQuestion();
}

function useHint() {
    if (lifelines.hint.used) return;
    
    const question = shuffledQuestions[currentQuestion];
    
    const existingHint = document.querySelector('.hint-message');
    if (existingHint) existingHint.remove();
    
    const hintDiv = document.createElement('div');
    hintDiv.className = 'hint-message';
    hintDiv.innerHTML = `💡 <strong>Hint:</strong> The correct answer is "${question.correct}"`;
    
    const questionContainer = document.querySelector('.question-container');
    questionContainer.appendChild(hintDiv);
    
    lifelines.hint.used = true;
    updateLifelineButtons();
}

// ============= RESULTS & STATISTICS =============

function showResults() {
    document.getElementById('game-area').style.display = 'none';
    const resultArea = document.getElementById('result-area');
    resultArea.style.display = 'block';
    
    const accuracy = Math.round((correctAnswers / shuffledQuestions.length) * 100);
    
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-total').textContent = shuffledQuestions.length;
    
    let statsHTML = `
        <div class="stats-container">
            <h3>📊 Your Statistics</h3>
            <div class="stat-grid">
                <div class="stat-item">
                    <div class="stat-label">Correct Answers</div>
                    <div class="stat-value correct-stat">${correctAnswers}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Incorrect Answers</div>
                    <div class="stat-value incorrect-stat">${incorrectAnswers}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Accuracy</div>
                    <div class="stat-value">${accuracy}%</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Best Streak</div>
                    <div class="stat-value streak-stat">🔥 ${bestStreak}</div>
                </div>
            </div>
    `;
    
    if (wrongKanji.length > 0) {
        statsHTML += `
            <div class="wrong-answers-section">
                <h4>📝 Review Your Mistakes</h4>
                <div class="wrong-answers-list">
        `;
        
        wrongKanji.forEach(item => {
            statsHTML += `
                <div class="wrong-answer-item">
                    <span class="wrong-kanji">${item.kanji}</span>
                    <span class="wrong-detail">You chose: <strong>${item.selected}</strong></span>
                    <span class="correct-detail">Correct: <strong class="correct-answer">${item.correct}</strong></span>
                </div>
            `;
        });
        
        statsHTML += `
                </div>
            </div>
        `;
    } else {
        statsHTML += `
            <div class="perfect-score">
                <h3>🎉 PERFECT SCORE! 🎉</h3>
                <p>You got every question right!</p>
            </div>
        `;
    }
    
    statsHTML += '</div>';
    
    const playAgainBtn = resultArea.querySelector('.btn');
    playAgainBtn.insertAdjacentHTML('beforebegin', statsHTML);
}

// ============= INITIALIZE =============

initCategoryScreen();