const tg = window.Telegram.WebApp;
tg.expand();

const usernameEl = document.getElementById('username');
const galleonCountEl = document.getElementById('galleon-count');
const clickWandBtn = document.getElementById('click-wand');
const critEffectEl = document.getElementById('crit-effect');
const buyLumosBtn = document.getElementById('buy-lumos');
const activateAccioBtn = document.getElementById('activate-accio');
const achievementListEl = document.getElementById('achievement-list');
const leaderListEl = document.getElementById('leader-list');
const loadLeaderboardBtn = document.getElementById('btn-load-leaderboard');

let galleons = 0;
let level = 1;
let lumosBought = false;
let accioActive = false;
let achievements = [];

usernameEl.textContent = tg.initDataUnsafe?.user?.username || 'Игрок';

// Ключ для сохранения прогресса в Telegram WebApp Storage
const STORAGE_KEY = 'hp_clicker_progress';
// Ключ для рейтинга (простой дневной рейтинг в localStorage)
const LEADERBOARD_KEY = 'hp_clicker_leaderboard';

function loadProgress() {
  const dataStr = localStorage.getItem(STORAGE_KEY);
  if (dataStr) {
    try {
      const data = JSON.parse(dataStr);
      galleons = data.galleons || 0;
      level = data.level || 1;
      lumosBought = data.lumosBought || false;
      accioActive = data.accioActive || false;
      achievements = data.achievements || [];
    } catch {}
  }
}

function saveProgress() {
  const data = { galleons, level, lumosBought, accioActive, achievements };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Обновляем UI
function updateUI() {
  galleonCountEl.textContent = galleons;
  buyLumosBtn.disabled = lumosBought || galleons < 50;
  activateAccioBtn.disabled = accioActive || galleons < 100;

  achievementListEl.innerHTML = '';
  if (achievements.length === 0) {
    achievementListEl.innerHTML = '<li>Пока нет достижений</li>';
  } else {
    achievements.forEach(a => {
      const li = document.createElement('li');
      li.textContent = a;
      achievementListEl.appendChild(li);
    });
  }
}

// Получить случайный множитель x1-x5
function getCritMultiplier() {
  const rand = Math.random();
  if (rand < 0.1) return 5;
  if (rand < 0.25) return 4;
  if (rand < 0.5) return 3;
  if (rand < 0.75) return 2;
  return 1;
}

function showCritEffect(multiplier) {
  if (multiplier === 1) return;
  critEffectEl.textContent = `x${multiplier}!`;
  critEffectEl.style.opacity = '1';
  setTimeout(() => {
    critEffectEl.style.opacity = '0';
  }, 1000);
}

// Клик по палочке
clickWandBtn.onclick = () => {
  let multiplier = getCritMultiplier();
  let gain = 1 * multiplier;

  if (accioActive) gain *= 2;

  galleons += gain;

  if (galleons >= 100 && !achievements.includes('Собрал 100 галлеонов')) {
    achievements.push('Собрал 100 галлеонов');
  }

  updateLeaderboard(galleons);

  showCritEffect(multiplier);
  updateUI();
  saveProgress();
};

// Автоклик от Люмос
let lumosInterval = null;

buyLumosBtn.onclick = () => {
  if (galleons < 50 || lumosBought) return;
  galleons -= 50;
  lumosBought = true;
  lumosInterval = setInterval(() => {
    galleons += 1;
    updateLeaderboard(galleons);
    updateUI();
    saveProgress();
  }, 1000);
  updateUI();
  saveProgress();
};

// Активировать бонус Акцио
activateAccioBtn.onclick = () => {
  if (galleons < 100 || accioActive) return;
  galleons -= 100;
  accioActive = true;
  updateUI();
  saveProgress();

  setTimeout(() => {
    accioActive = false;
    updateUI();
    saveProgress();
  }, 15000);
};

// Рейтинг игроков в localStorage (по username и галлеонам)
function updateLeaderboard(score) {
  if (!usernameEl.textContent) return;

  let leaderboard = JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];

  // Сегодняшняя дата
  const today = new Date().toISOString().slice(0, 10);

  // Фильтруем по сегодняшнему дню
  leaderboard = leaderboard.filter(entry => entry.date === today);

  // Ищем игрока
  const playerIndex = leaderboard.findIndex(e => e.username === usernameEl.textContent);

  if (playerIndex === -1) {
    leaderboard.push({ username: usernameEl.textContent, score, date: today });
  } else {
    if (score > leaderboard[playerIndex].score) {
      leaderboard[playerIndex].score = score;
    }
  }

  // Сортируем по убыванию
  leaderboard.sort((a, b) => b.score - a.score);

  // Ограничим до топ 10
  if (leaderboard.length > 10) leaderboard = leaderboard.slice(0, 10);

  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
}

function showLeaderboard() {
  leaderListEl.innerHTML = '';
  const today = new Date().toISOString().slice(0, 10);
  const leaderboard = JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];

  // Фильтруем по сегодняшнему дню
  const todayLeaderboard = leaderboard.filter(entry => entry.date === today);

  if (todayLeaderboard.length === 0) {
    leaderListEl.innerHTML = '<li>Пока нет игроков в рейтинге сегодня</li>';
    return;
  }

  todayLeaderboard.forEach((entry, i) => {
    const li = document.createElement('li');
    li.textContent = `${i + 1}. ${entry.username} — ${entry.score} галлеонов`;
    leaderListEl.appendChild(li);
  });
}

loadLeaderboardBtn.onclick = () => {
  showLeaderboard();
};

loadProgress();
updateUI();
updateLeaderboard(galleons);
