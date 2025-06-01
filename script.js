const galleonsCountEl = document.getElementById('galleons-count');
const levelCountEl = document.getElementById('level-count');
const clickWandBtn = document.getElementById('click-wand');
const leaderboardListEl = document.getElementById('leaderboard-list');
const storeItemsEl = document.getElementById('store-items');
const achievementsEl = document.getElementById('achievements');

let galleons = 0;
let level = 1;
const maxLevel = 4;

let autoclickInterval = null;

const username = window.Telegram?.WebApp?.initDataUnsafe?.user?.username || 'Игрок';

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
  updateStoreButtons();
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
    if (level === 2) startAutoClick();
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
  if (autoclickInterval) return;
  autoclickInterval = setInterval(() => {
    galleons++;
    updateDisplay();
    saveProgress();
  }, 3000);
}

function stopAutoClick() {
  if (autoclickInterval) {
    clearInterval(autoclickInterval);
    autoclickInterval = null;
  }
}

// Магазин улучшений с ростом цены
const storeItems = [
  {
    id: 'lumos',
    name: 'Люмос (Автоклик)',
    basePrice: 20,
    price: 20,
    levelRequired: 2,
    owned: 0,
    maxOwned: 10,
    effect: () => {
      startAutoClick();
    }
  },
  {
    id: 'accio',
    name: 'Акцио (Бонус)',
    basePrice: 50,
    price: 50,
    levelRequired: 3,
    owned: 0,
    maxOwned: 5,
    effect: () => {
      galleons += 10;
      showBonusEffect(10, 1);
      updateDisplay();
      saveProgress();
    }
  },
  {
    id: 'avada',
    name: 'Авада (Атака)',
    basePrice: 100,
    price: 100,
    levelRequired: 4,
    owned: 0,
    maxOwned: 3,
    effect: () => {
      galleons += 20;
      showBonusEffect(20, 1);
      updateDisplay();
      saveProgress();
    }
  }
];

function updateStoreButtons() {
  storeItemsEl.innerHTML = '';
  storeItems.forEach(item => {
    if (level >= item.levelRequired) {
      const div = document.createElement('div');
      div.className = 'store-item';
      div.innerHTML = `
        <span>${item.name} — Цена: ${item.price} галлеонов (Куплено: ${item.owned})</span>
        <button ${galleons < item.price || item.owned >= item.maxOwned ? 'disabled' : ''} data-id="${item.id}">Купить</button>
      `;
      storeItemsEl.appendChild(div);

      div.querySelector('button').addEventListener('click', () => {
        buyStoreItem(item.id);
      });
    }
  });
}

function buyStoreItem(id) {
  const item = storeItems.find(i => i.id === id);
  if (!item) return;

  if (galleons >= item.price && item.owned < item.maxOwned) {
    galleons -= item.price;
    item.owned++;
    item.price = Math.floor(item.basePrice * Math.pow(1.5, item.owned)); // цена растёт на 50% с каждым улучшением
    item.effect();
    updateStoreButtons();
    updateDisplay();
    saveProgress();
  }
}

// Локальный рейтинг игроков (демо)
const dailyLeaderboardKey = 'hp_clicker_leaderboard';

function saveDailyLeaderboard() {
  let leaderboard = JSON.parse(localStorage.getItem(dailyLeaderboardKey)) || [];
  const userIndex = leaderboard.findIndex(u => u.name === username);
  if (userIndex >= 0) {
    if (galleons > leaderboard[userIndex].score) {
      leaderboard[userIndex].score = galleons;
    }
  } else {
    leaderboard.push({ name: username, score: galleons });
  }
  leaderboard.sort((a,b) => b.score - a.score);
  if (leaderboard.length > 10) leaderboard.length = 10;
  localStorage.setItem(dailyLeaderboardKey, JSON.stringify(leaderboard));
  displayLeaderboard(leaderboard);
}

function displayLeaderboard(leaderboard) {
  leaderboardListEl.innerHTML = '';
  leaderboard.forEach((player, index) => {
    const div = document.createElement('div');
    div.textContent = `${index + 1}. ${player.name} — ${player.score} галлеонов`;
    leaderboardListEl.appendChild(div);
  });
}

// Инициализация
function init() {
  loadProgress();
  saveDailyLeaderboard();
  updateStoreButtons();

  clickWandBtn.addEventListener('click', clickWand);

  // Магазин и рейтинг показываем сразу и всегда
  document.getElementById('store').style.display = 'block';
  document.getElementById('leaderboard').style.display = 'block';
}

init();
