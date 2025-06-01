const galleonsCountEl = document.getElementById('galleons-count');
const levelCountEl = document.getElementById('level-count');
const clickWandBtn = document.getElementById('click-wand');
const showLeaderboardBtn = document.getElementById('show-leaderboard');
const leaderboardEl = document.getElementById('leaderboard');
const achievementsEl = document.getElementById('achievements');
const usernameEl = document.getElementById('username');

let galleons = 0;
let level = 1;
const maxLevel = 4;

let autclickInterval = null;

const username = window.Telegram?.WebApp?.initDataUnsafe?.user?.username || 'Игрок';
usernameEl.textContent = `Привет, ${username}!`;

function loadProgress() {
  const saved = localStorage.getItem('hp_clicker_progress');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      galleons = data.galleons || 0;
      level = data.level || 1;
    } catch {
      galleons = 0;
      level = 1;
    }
  }
  updateDisplay();
}

function saveProgress() {
  localStorage.setItem('hp_clicker_progress', JSON.stringify({ galleons, level }));
  saveDailyLeaderboard();
}

function updateDisplay() {
  galleonsCountEl.textContent = galleons;
  levelCountEl.textContent = level;
}

function clickWand() {
  const baseGain = 1;
  const multiplierChance = Math.random();

  let multiplier = 1;
  if (multiplierChance < 0.15) multiplier = 5;
  else if (multiplierChance < 0.3) multiplier = 4;
  else if (multiplierChance < 0.5) multiplier = 3;
  else if (multiplierChance < 0.7) multiplier = 2;

  const gain = baseGain * multiplier;
  galleons += gain;

  showBonusEffect(gain, multiplier);

  checkLevelUp();
  updateDisplay();
  saveProgress();
}

function showBonusEffect(gain, multiplier) {
  const effect = document.createElement('div');
  effect.className = 'bonus-effect';
  effect.textContent = multiplier > 1 ? `+${gain} x${multiplier}!` : `+${gain}`;
  
  const rect = clickWandBtn.getBoundingClientRect();
  effect.style.left = `${rect.left + rect.width / 2}px`;
  effect.style.top = `${rect.top}px`;

  document.body.appendChild(effect);

  effect.animate([
    { transform: 'translateY(0) scale(1)', opacity: 1 },
    { transform: 'translateY(-50px) scale(1.5)', opacity: 0 }
  ], {
    duration: 1000,
    easing: 'ease-out'
  });

  setTimeout(() => effect.remove(), 1000);
}

function checkLevelUp() {
  const levelThresholds = [0, 10, 30, 70, 150];
  if (level < maxLevel && galleons >= levelThresholds[level]) {
    level++;
    showAchievement(`Поздравляем! Ты достиг уровня ${level}`);
  }
}

function showAchievement(text) {
  achievementsEl.textContent = text;
  setTimeout(() => {
    achievementsEl.textContent = '';
  }, 3500);
}

// Автоклик (Люмос)
function startAutoClick() {
  if (autclickInterval) return;
  autclickInterval = setInterval(() => {
    galleons++;
    updateDisplay();
    saveProgress();
  }, 3000);
}

function stopAutoClick() {
  if (autclickInterval) {
    clearInterval(autclickInterval);
    autclickInterval = null;
  }
}

function getTodayKey() {
  return `hp_clicker_leaderboard_${new Date().toISOString().slice(0,10)}`;
}

function loadDailyLeaderboard() {
  const key = getTodayKey();
  const dataRaw = localStorage.getItem(key);
  if (!dataRaw) return {};
  try {
    return JSON.parse(dataRaw);
  } catch {
    return {};
  }
}

function saveDailyLeaderboard() {
  const key = getTodayKey();
  const leaderboard = loadDailyLeaderboard();
  leaderboard[username] = Math.max(leaderboard[username] || 0, galleons);
  localStorage.setItem(key, JSON.stringify(leaderboard));
}

function renderLeaderboard() {
  const leaderboard = loadDailyLeaderboard();
  const entries = Object.entries(leaderboard);
  entries.sort((a,b) => b[1] - a[1]);

  if (entries.length === 0) {
    leaderboardEl.innerHTML = '<p>Рейтинг пуст.</p>';
    return;
  }

  const html = entries.map(([user, score], idx) => {
    const highlight = user === username ? ' style="color:#fff; font-weight: 700;"' : '';
    return `<div${highlight}>${idx + 1}. ${user} — ${score} галлеонов</div>`;
  }).join('');
  leaderboardEl.innerHTML = html;
}

clickWandBtn.addEventListener('click', () => {
  clickWand();
});

showLeaderboardBtn.addEventListener('click', () => {
  if (leaderboardEl.classList.contains('hidden')) {
    renderLeaderboard();
    leaderboardEl.classList.remove('hidden');
    showLeaderboardBtn.textContent = 'Скрыть рейтинг';
  } else {
    leaderboardEl.classList.add('hidden');
    showLeaderboardBtn.textContent = 'Показать рейтинг';
  }
});

// Инициализация
loadProgress();

// Запуск автоклика для примера
if (level >= 2) startAutoClick();
