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

// Initialize category selection screen
function initCategoryScreen() {
    const categoryGrid = document.getElementById('category-grid');
    categoryGrid.innerHTML = '';
    
    // Create category cards
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

// Select category and start game
function selectCategory(category) {
    selectedCategory = category;
    document.getElementById('category-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    initGame();
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function initGame() {
    // Filter kanji by selected category
    const filteredKanji = selectedCategory === 'all' 
        ? kanjiData 
        : kanjiData.filter(k => k.category === selectedCategory);
    
    shuffledQuestions = shuffleArray(filteredKanji).slice(0, 10);
    currentQuestion = 0;
    score = 0;
    correctAnswers = 0;
    incorrectAnswers = 0;
    currentStreak = 0;
    bestStreak = 0;
    wrongKanji = [];
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
        // Track wrong kanji for review
        wrongKanji.push({
            kanji: question.kanji,
            correct: correct,
            selected: selected
        });
    }

    document.getElementById('next-btn').style.display = 'block';
}

function showResults() {
    document.getElementById('game-area').style.display = 'none';
    const resultArea = document.getElementById('result-area');
    resultArea.style.display = 'block';
    
    const accuracy = Math.round((correctAnswers / shuffledQuestions.length) * 100);
    
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-total').textContent = shuffledQuestions.length;
    
    // Build detailed statistics
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
    
    // Show wrong answers if any
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
    
    // Insert stats before the play again button
    const playAgainBtn = resultArea.querySelector('.btn');
    playAgainBtn.insertAdjacentHTML('beforebegin', statsHTML);
}

document.getElementById('next-btn').onclick = () => {
    currentQuestion++;
    displayQuestion();
};

// Initialize the game when page loads
initCategoryScreen();