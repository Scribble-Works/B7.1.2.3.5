// Game Configuration
const MAX_QUESTIONS = 20;
let score = 0;
let questionNumber = 0;
let currentProblem = null;

// --- Sound Effects ---
const correctSound = new Audio('assets/brass-fanfare-reverberated-146263.mp3');
const wrongSound = new Audio('assets/cartoon-fail-trumpet-278822.mp3');

// Preload sounds to reduce playback latency
correctSound.load();
wrongSound.load();

// Helper function to format powers nicely (e.g., 2^3)
function formatPower(base, exponent) {
    return `${base}<sup style="font-size:0.6em; position:relative; top:-0.5em;">${exponent}</sup>`;
}

// Helper function to format the full index form expression
function formatExpression(factors) {
    return factors.map(f => formatPower(f.base, f.exponent)).join(' &times; ');
}

// Helper to shuffle arrays
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- PROBLEM DATA (Expanded slightly to ensure variety over 20 questions) ---
const ALL_PROBLEMS = [
    // HCF = 2^2 * 5^1 * 3^1
    [
        [{base: 2, exponent: 3}, {base: 5, exponent: 1}, {base: 3, exponent: 4}],
        [{base: 2, exponent: 2}, {base: 5, exponent: 3}, {base: 7, exponent: 1}, {base: 3, exponent: 1}],
        '2² × 5¹ × 3¹', 
        ['2³ × 3⁴ × 5³ × 7¹', '2³ × 5¹', '2² × 3⁴ × 5³']
    ],
    // HCF = 3^3 (Only 3 is common)
    [
        [{base: 3, exponent: 3}, {base: 5, exponent: 2}],
        [{base: 3, exponent: 5}, {base: 7, exponent: 1}],
        '3³',
        ['3⁵ × 5² × 7¹', '3⁵', '5²']
    ],
    // HCF = 2^1 * 5^1
    [
        [{base: 2, exponent: 1}, {base: 5, exponent: 4}, {base: 11, exponent: 1}],
        [{base: 2, exponent: 3}, {base: 5, exponent: 1}, {base: 7, exponent: 2}],
        '2¹ × 5¹',
        ['2³ × 5⁴ × 7² × 11¹', '2³ × 5⁴', '2¹ × 5⁴']
    ],
    // HCF = 7^2 * 11^3
    [
        [{base: 7, exponent: 2}, {base: 11, exponent: 4}],
        [{base: 7, exponent: 5}, {base: 11, exponent: 3}],
        '7² × 11³',
        ['7⁵ × 11⁴', '7² × 11⁴', '7⁵ × 11³']
    ],
    // HCF = 2^2
    [
        [{base: 2, exponent: 2}, {base: 5, exponent: 1}],
        [{base: 2, exponent: 5}, {base: 3, exponent: 1}],
        '2²',
        ['2⁵ × 3¹ × 5¹', '2⁵', '3¹ × 5¹']
    ],
    // HCF = 3^2 * 7^1
    [
        [{base: 3, exponent: 2}, {base: 7, exponent: 1}],
        [{base: 3, exponent: 4}, {base: 7, exponent: 3}, {base: 5, exponent: 1}],
        '3² × 7¹',
        ['3⁴ × 7³ × 5¹', '3² × 7³', '3⁴ × 7¹']
    ],
    // HCF = 5^1 (Only 5 is common)
    [
        [{base: 5, exponent: 1}, {base: 13, exponent: 2}],
        [{base: 5, exponent: 3}, {base: 17, exponent: 1}],
        '5¹',
        ['5³ × 13² × 17¹', '5³', '13²']
    ],
    // HCF = 2^1 * 3^1 * 5^1
    [
        [{base: 2, exponent: 1}, {base: 3, exponent: 2}, {base: 5, exponent: 3}],
        [{base: 2, exponent: 4}, {base: 3, exponent: 1}, {base: 5, exponent: 1}],
        '2¹ × 3¹ × 5¹',
        ['2⁴ × 3² × 5³', '2¹ × 3² × 5³', '2⁴ × 3¹ × 5¹']
    ]
];

let availableProblems = [...ALL_PROBLEMS]; 

// --- DOM Elements ---
const numberAEl = document.getElementById('number-a').querySelector('.index-form');
const numberBEl = document.getElementById('number-b').querySelector('.index-form');
const optionsContainer = document.getElementById('options-container');
const feedbackArea = document.getElementById('feedback-area');
const nextButton = document.getElementById('next-button');
const scoreTracker = document.getElementById('score-tracker');
const questionCounter = document.getElementById('question-counter');
const gameScreen = document.getElementById('game-screen');
const resultsScreen = document.getElementById('results-screen');
const finalScoreDisplay = document.getElementById('final-score-display');
const celebrationMessage = document.getElementById('celebration-message');

// --- Core Functions ---

/**
 * Displays the end screen with final score and celebration message.
 */
function endGame() {
    gameScreen.style.display = 'none';
    resultsScreen.style.display = 'block';

    finalScoreDisplay.textContent = `${score} / ${MAX_QUESTIONS}`;

    const percentage = (score / MAX_QUESTIONS) * 100;
    let message = '';
    
    if (percentage >= 90) {
        message = "👑 Masterful! You are an expert at HCF using powers.";
    } else if (percentage >= 70) {
        message = "🌟 Excellent! Your understanding of common factors is strong.";
    } else if (percentage >= 50) {
        message = "👍 Good effort! Remember to always choose the lowest power.";
    } else {
        message = "Keep practicing! Review the rule: HCF uses the lowest power of common primes.";
    }

    celebrationMessage.textContent = message;
}

/**
 * Renders the current problem and options.
 */
function loadNewProblem() {
    if (questionNumber >= MAX_QUESTIONS) {
        endGame();
        return;
    }
    
    questionNumber++;
    questionCounter.textContent = questionNumber;

    // To ensure 20 questions, we keep picking randomly without removing from ALL_PROBLEMS
    const randomIndex = Math.floor(Math.random() * ALL_PROBLEMS.length);
    currentProblem = ALL_PROBLEMS[randomIndex];

    const [factorsA, factorsB, correctHCF, distractors] = currentProblem;
    
    // Display problem numbers
    numberAEl.innerHTML = formatExpression(factorsA);
    numberBEl.innerHTML = formatExpression(factorsB);

    // Combine correct answer and distractors, then shuffle
    let options = [...distractors, correctHCF];
    shuffle(options);
    
    // Render options
    optionsContainer.innerHTML = '';
    options.forEach(option => {
        const button = document.createElement('button');
        
        // Convert the raw option string (e.g., '2² × 3¹') into formatted HTML for display
        const formattedOption = option
            .replace(/(\d)¹/g, (_, base) => formatPower(base, '1'))
            .replace(/(\d)²/g, (_, base) => formatPower(base, '2'))
            .replace(/(\d)³/g, (_, base) => formatPower(base, '3'))
            .replace(/(\d)⁴/g, (_, base) => formatPower(base, '4'))
            .replace(/(\d)⁵/g, (_, base) => formatPower(base, '5'))
            .replace(/(\d)⁶/g, (_, base) => formatPower(base, '6'))
            .replace(/×/g, '&times;');

        button.innerHTML = formattedOption;
        button.classList.add('option-button');
        button.setAttribute('data-value', option); 
        button.onclick = checkAnswer;
        optionsContainer.appendChild(button);
    });

    // Reset feedback
    feedbackArea.textContent = 'Select the HCF (Lowest shared powers).';
    feedbackArea.className = 'feedback';
    nextButton.style.display = 'none';
}

/**
 * Checks the user's selected option.
 */
function checkAnswer(event) {
    // Disable all buttons to prevent multiple clicks
    document.querySelectorAll('.option-button').forEach(btn => btn.onclick = null);

    const selectedValue = event.target.getAttribute('data-value');
    const correctHCF = currentProblem[2];

    if (selectedValue === correctHCF) {
        feedbackArea.textContent = '🥳 Correct! HCF uses the lowest power of common primes. (+1)';
        feedbackArea.className = 'feedback correct';
        event.target.style.backgroundColor = '#3cb371'; // Highlight correct button green
        score++;
        scoreTracker.textContent = score;

        // Play correct sound
        correctSound.currentTime = 0;
        correctSound.play().catch(e => console.debug("Correct sound not played:", e));
    } else {
        feedbackArea.textContent = '❌ Incorrect. Review the lowest common power.';
        feedbackArea.className = 'feedback incorrect';
        event.target.style.backgroundColor = '#dc143c'; // Highlight incorrect button red
        
        // Highlight the correct answer
        document.querySelectorAll('.option-button').forEach(btn => {
            if (btn.getAttribute('data-value') === correctHCF) {
                btn.style.border = '4px solid #3cb371';
            }
        });

        // Play wrong sound
        wrongSound.currentTime = 0;
        wrongSound.play().catch(e => console.debug("Wrong sound not played:", e));
    }
    
    nextButton.style.display = 'block'; 
}

// --- Event Listeners and Initial Load ---
nextButton.addEventListener('click', loadNewProblem);

// Load the first problem when the page loads
window.onload = loadNewProblem;