const galleonsCountEl = document.getElementById('galleons-count');
const levelCountEl = document.getElementById('level-count');
const clickWandBtn = document.getElementById('click-wand');
const btnShop = document.getElementById('btn-shop');
const btnLeaderboard = document.getElementById('btn-leaderboard');
const leaderboardEl = document.getElementById('leaderboard');
const shopEl = document.getElementById('shop');
const achievementsEl = document.getElementById('achievements');
const usernameEl = document.getElementById('username');

let galleons = 0;
let level = 1;
const maxLevel = 5;

let autclickInterval = null;
let wandUpgradeLevel = 0;
const wandUpgradeBasePrice = 10;

const username = window.Telegram?.WebApp?.initDataUnsafe?.user?.username || '';
usernameEl.textContent = ''; // Убираем приветствие, как просил

function loadProgress() {
  const saved = localStorage.getItem('hp_clicker_progress');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      galleons = data.galleons || 0;
      level = data.level || 1;
      wandUpgradeLevel = data.wandUpgradeLevel || 0;
    } catch {
      galleons = 0;
      level = 1;
      wandUpgradeLevel = 0;
    }
  }
  updateDisplay();
}

function saveProgress() {
  localStorage.setItem('hp_clicker_progress', JSON.stringify({ galleons, level, wandUpgradeLevel }));
  saveDailyLeaderboard();
}

function updateDisplay() {
  galleonsCountEl.textContent = galleons;
  levelCountEl.textContent = level;
}

function getWandUpgradePrice() {
  return wandUpgradeBasePrice * Math.pow(2, wandUpgradeLevel);
}

function clickWand() {
  let baseGain = 1 + wandUpgradeLevel; // +1 галеон за уровень палочки
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
  const levelThresholds = [0, 10, 30, 70, 150, 300];
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

function startAutoClick() {
  if (autclickInterval) clearInterval(autclickInterval);
  autclickInterval = setInterval(() => {
    galleons += 1 + wandUpgradeLevel;
    updateDisplay();
    saveProgress();
  }, 3000);
}

function renderShop() {
  shopEl.innerHTML = `<h2>Магазин улучшений</h2>`;
  shopEl.innerHTML += `<div>Уровень палочки: ${wandUpgradeLevel}</div>`;
  shopEl.innerHTML += `<button id="btn-upgrade-wand" ${galleons < getWandUpgradePrice() ? 'disabled' : ''}>Купить улучшение палочки (${getWandUpgradePrice()} галлеонов)</button>`;

  document.getElementById('btn-upgrade-wand').onclick = () => {
    const price = getWandUpgradePrice();
    if (galleons >= price) {
      galleons -= price;
      wandUpgradeLevel++;
      updateDisplay();
      renderShop();
      saveProgress();
      showAchievement(`Палочка улучшена! Уровень: ${wandUpgradeLevel}`);
    }
  };
}

function toggleShop() {
  if (shopEl.classList.contains('hidden')) {
    renderShop();
    shopEl.classList.remove('hidden');
    leaderboardEl.classList.add('hidden');
  } else {
    shopEl.classList.add('hidden');
  }
}

function renderLeaderboard() {
  leaderboardEl.innerHTML = '<h2>Рейтинг игроков</h2>';
  const dailyLeaderboard = loadDailyLeaderboard();
  if (!dailyLeaderboard.length) {
    leaderboardEl.innerHTML += '<div>Нет данных</div>';
  } else {
    dailyLeaderboard.forEach((item, idx) => {
      // Убираем слово "улучшить" и заменяем на имя игрока (если есть)
      const name = idx === 0 ? 'ODE Finder' : (item.name || 'Игрок');
      leaderboardEl.innerHTML += `<div>${idx + 1}. ${name} — ${item.score} галлеонов</div>`;
    });
  }
}

function toggleLeaderboard() {
  if (leaderboardEl.classList.contains('hidden')) {
    renderLeaderboard();
    leaderboardEl.classList.remove('hidden');
    shopEl.classList.add('hidden');
  } else {
    leaderboardEl.classList.add('hidden');
  }
}

btnShop.addEventListener('click', toggleShop);
btnLeaderboard.addEventListener('click', toggleLeaderboard);
clickWandBtn.addEventListener('click', clickWand);

function loadDailyLeaderboard() {
  const data = localStorage.getItem('hp_clicker_leaderboard');
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveDailyLeaderboard() {
  const leaderboard = loadDailyLeaderboard();
  const name = username || 'Игрок';
  const existing = leaderboard.find(item => item.name === name);

  if (existing) {
    if (galleons > existing.score) existing.score = galleons;
  } else {
    leaderboard.push({ name, score: galleons });
  }
  // Сортируем по убыванию
  leaderboard.sort((a,b) => b.score - a.score);

  // Максимум 10 записей
  if (leaderboard.length > 10) leaderboard.length = 10;

  localStorage.setItem('hp_clicker_leaderboard', JSON.stringify(leaderboard));
}

loadProgress();
