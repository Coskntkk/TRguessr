let allCities = [];
let gameQueue = [];
let currentQuestionIndex = 0;
let score = 0;
let correctCount = 0;
let wrongCount = 0;
let selectedDifficulty = 'all';
let map;

window.onload = function () {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            console.log(data);
            allCities = data;
            setupAutocomplete();
        })
        .catch(err => console.error("Şehir verileri yüklenirken hata oluştu:", err));
};

function setDifficulty(level, element) {
    selectedDifficulty = level;
    document.querySelectorAll('#lobby-screen .btn-select').forEach(b => b.classList.remove('selected'));
    element.classList.add('selected');
}

function startSelectedGame() {
    if (selectedDifficulty === 'all') {
        gameQueue = [...allCities];
    } else {
        gameQueue = allCities.filter(c => c.difficulty === parseInt(selectedDifficulty));
    }

    if (gameQueue.length === 0) {
        alert("Bu zorluk derecesinde şehir bulunamadı!");
        return;
    }

    gameQueue.sort(() => Math.random() - 0.5);
    gameQueue = gameQueue.slice(0, 10);

    currentQuestionIndex = 0;
    score = 0;
    correctCount = 0;
    wrongCount = 0;

    document.getElementById('lobby-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');

    initMap();
}

function initMap() {
    const firstQ = gameQueue[currentQuestionIndex];
    if (!map) {
        map = L.map('map', {
            zoomControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            touchZoom: false
        }).setView(firstQ.coords, 12);

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Esri'
        }).addTo(map);
    }
    loadQuestion();
}

function loadQuestion() {
    const currentQ = gameQueue[currentQuestionIndex];

    map.setView(currentQ.coords, 12);

    let diffText = currentQ.difficulty === 1 ? "Kolay" : currentQ.difficulty === 2 ? "Orta" : "Zor 💀";
    document.getElementById('info-difficulty').innerText = `Zorluk: ${diffText}`;
    document.getElementById('info-score').innerText = `Skor: ${score}`;
    document.getElementById('info-progress').innerText = `Soru: ${currentQuestionIndex + 1}/${gameQueue.length}`;

    const input = document.getElementById('city-input');
    input.value = "";
    input.disabled = false;
    input.focus();
    document.getElementById('result').innerText = "";
    document.getElementById('next-btn').style.display = 'none';
}

function setupAutocomplete() {
    const input = document.getElementById('city-input');
    const box = document.getElementById('autocomplete-box');

    // Input alanında bir tuşa basıldığında çalışır
    input.onkeydown = function (e) {
        if (e.key === 'Enter') {
            const val = input.value.trim().toLocaleUpperCase('tr-TR');
            if (!val) return;

            // Yazılan metne tam uyan ya da onunla başlayan ilk şehri bul
            const exactOrFirstMatch = allCities.find(c => 
                c.cityName.toLocaleUpperCase('tr-TR') === val || 
                c.cityName.toLocaleUpperCase('tr-TR').startsWith(val)
            );

            if (exactOrFirstMatch) {
                input.value = exactOrFirstMatch.cityName;
                box.innerHTML = "";
                input.blur(); // Mobilde klavyeyi kapatır
                checkAnswer(exactOrFirstMatch.cityName);
            }
        }
    };

    // Mevcut input (otomatik tamamlama listesi) mantığı
    input.oninput = function () {
        const val = input.value.trim().toLocaleUpperCase('tr-TR');
        box.innerHTML = "";
        if (!val) return;

        const matches = allCities.filter(c => 
            c.cityName.toLocaleUpperCase('tr-TR').startsWith(val)
        ).slice(0, 5);

        matches.forEach(match => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.innerText = match.cityName;
            item.onclick = function () {
                input.value = match.cityName;
                box.innerHTML = "";
                input.blur();
                checkAnswer(match.cityName);
            };
            box.appendChild(item);
        });
    };
}

function checkAnswer(guessedName) {
    const currentQ = gameQueue[currentQuestionIndex];
    const input = document.getElementById('city-input');
    input.disabled = true;
    document.getElementById('autocomplete-box').innerHTML = "";

    const resultDiv = document.getElementById('result');

    if (guessedName === currentQ.cityName) {
        resultDiv.innerText = "🎉 Doğru Tahmin!";
        resultDiv.style.color = "#4caf50";
        score += currentQ.difficulty * 10;
        correctCount++;
    } else {
        resultDiv.innerText = `❌ Yanlış! Doğru cevap: ${currentQ.cityName}`;
        resultDiv.style.color = "#f44336";
        wrongCount++;
    }

    document.getElementById('info-score').innerText = `Skor: ${score}`;
    document.getElementById('next-btn').style.display = 'block';
}

document.getElementById('next-btn').onclick = function () {
    currentQuestionIndex++;
    if (currentQuestionIndex < gameQueue.length) {
        loadQuestion();
    } else {
        showGameOver();
    }
};

function showGameOver() {
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('game-over-screen').classList.add('active');

    document.getElementById('stat-total').innerText = gameQueue.length;
    document.getElementById('stat-correct').innerText = correctCount;
    document.getElementById('stat-wrong').innerText = wrongCount;
    document.getElementById('stat-score').innerText = score;
}