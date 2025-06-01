const galleonsCountEl = document.getElementById('galleons-count');
const levelCountEl = document.getElementById('level-count');
const clickWandBtn = document.getElementById('click-wand');
const showLeaderboardBtn = document.getElementById('show-leaderboard'); // больше не используется
const leaderboardEl = document.getElementById('leaderboard');
const shopEl = document.getElementById('shop');
const achievementsEl = document.getElementById('achievements');

const btnShop = document.getElementById('btn-shop');
const btnLeaderboard = document.getElementById('btn-leaderboard');

let galleons = 0;
let level = 1;
const maxLevel = 4;

let autclickInterval = null;

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

// Рейтинг (ежедневный)
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

// Магазин с динамическими ценами

const upgrades = [
  { id: 'lumos', name: 'Люмос (Автоклик)', basePrice: 15, level: 0, effect() { startAutoClick(); } },
  { id: 'accio', name: 'Акцио (Бонус)', basePrice: 30, level: 0 },
  { id: 'avada', name: 'Авада (Отнимает у других)', basePrice: 50, level: 0 },
];

function getUpgradePrice(upgrade) {
  // Цена растёт с уровнем: basePrice * 1.7^level (округлённо)
  return Math.round(upgrade.basePrice * Math.pow(1.7, upgrade.level));
}

function canBuy(upgrade) {
  return galleons >= getUpgradePrice(upgrade);
}

function buyUpgrade(id) {
  const upgrade = upgrades.find(u => u.id === id);
  if (!upgrade) return;
  const price = getUpgradePrice(upgrade);
  if (galleons < price) {
    showAchievement('Недостаточно галлеонов!');
    return;
  }
  galleons -= price;
  upgrade.level++;
  if (upgrade.effect) upgrade.effect();
  showAchievement(`Куплено: ${upgrade.name} уровень ${upgrade.level}`);
  renderShop();
  updateDisplay();
  saveProgress();
}

function renderShop() {
  const html = upgrades.map(u => {
    const price = getUpgradePrice(u);
    const canBuyClass = canBuy(u) ? 'can-buy' : 'cannot-buy';
    return `
      <div class="upgrade-item">
        <div>${u.name} (Уровень: ${u.level})</div>
        <button class="${canBuyClass}" onclick="buyUpgrade('${u.id}')">Купить за ${price}</button>
      </div>`;
  }).join('');
  shopEl.innerHTML = html;
}

// Обработчики вкладок

btnShop.addEventListener('click', () => {
  shopEl.classList.remove('hidden');
  leaderboardEl.classList.add('hidden');
  btnShop.classList.add('active');
  btnLeaderboard.classList.remove('active');
});

btnLeaderboard.addEventListener('click', () => {
  renderLeaderboard();
  leaderboardEl.classList.remove('hidden');
  shopEl.classList.add('hidden');
  btnLeaderboard.classList.add('active');
  btnShop.classList.remove('active');
});

// По умолчанию вкладки скрыты, кнопки неактивны
function initTabs() {
  shopEl.classList.add('hidden');
  leaderboardEl.classList.add('hidden');
  btnShop.classList.remove('active');
  btnLeaderboard.classList.remove('active');
}

window.buyUpgrade = buyUpgrade; // чтобы работал из html onclick

loadProgress();
initTabs();

clickWandBtn.addEventListener('click', clickWand);
clickWandBtn.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    clickWand();
  }
});
