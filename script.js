const galleonsCountEl = document.getElementById('galleons-count');
const levelCountEl = document.getElementById('level-count');
const clickWandBtn = document.getElementById('click-wand');
const leaderboardTab = document.getElementById('leaderboard-tab');
const shopTab = document.getElementById('shop-tab');
const achievementsEl = document.getElementById('achievements');
const usernameEl = document.getElementById('username');

const tabButtons = document.querySelectorAll('.tab-button');

let galleons = 0;
let level = 1;
const maxLevel = 4;

let baseGain = 1;
let autoClickInterval = null;

const username = window.Telegram?.WebApp?.initDataUnsafe?.user?.username || '';
if(username) {
  usernameEl.textContent = `Привет, ${username}!`;
} else {
  usernameEl.textContent = ''; // убираем приветствие если нет username
}

// Улучшения магазина
const upgrades = {
  autoClick: {
    name: 'Люмос (Автоклик)',
    baseCost: 15,
    cost: 15,
    level: 0,
    maxLevel: 5,
  },
  wandUpgrade: {
    name: 'Улучшение палочки',
    baseCost: 10,
    cost: 10,
    level: 0,
    maxLevel: 5,
  }
};

function loadProgress() {
  const saved = localStorage.getItem('hp_clicker_progress');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      galleons = data.galleons || 0;
      level = data.level || 1;
      upgrades.autoClick.level = data.autoClickLevel || 0;
      upgrades.autoClick.cost = upgrades.autoClick.baseCost * Math.pow(2, upgrades.autoClick.level);
      upgrades.wandUpgrade.level = data.wandUpgradeLevel || 0;
      upgrades.wandUpgrade.cost = upgrades.wandUpgrade.baseCost * Math.pow(2, upgrades.wandUpgrade.level);
      baseGain = 1 + upgrades.wandUpgrade.level; // каждый уровень улучшения палочки +1 к базовому клику
    } catch {
      galleons = 0;
      level = 1;
    }
  }
  updateDisplay();
  renderShop();
}

function saveProgress() {
  localStorage.setItem('hp_clicker_progress', JSON.stringify({
    galleons,
    level,
    autoClickLevel: upgrades.autoClick.level,
    wandUpgradeLevel: upgrades.wandUpgrade.level
  }));
  saveDailyLeaderboard();
}

function updateDisplay() {
  galleonsCountEl.textContent = galleons;
  levelCountEl.textContent = level;
}

function clickWand() {
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
  const levelThreshold = level * 100;
  if (galleons >= levelThreshold) {
    level++;
    galleons -= levelThreshold;
    achievementsEl.textContent = `Вы достигли уровня ${level}!`;
    if (level === 2 && !autoClickInterval) {
      startAutoClick();
    }
  }
}

function startAutoClick() {
  autoClickInterval = setInterval(() => {
    if (upgrades.autoClick.level > 0) {
      const autoGain = upgrades.autoClick.level * baseGain;
      galleons += autoGain;
      updateDisplay();
      saveProgress();
    }
  }, 2000);
}

function renderShop() {
  shopTab.innerHTML = '';

  Object.keys(upgrades).forEach(key => {
    const upgrade = upgrades[key];
    const canBuy = galleons >= upgrade.cost && upgrade.level < upgrade.maxLevel;

    const item = document.createElement('div');
    item.className = 'upgrade-item';

    const name = document.createElement('span');
    name.textContent = `${upgrade.name} (уровень: ${upgrade.level}) — Цена: ${upgrade.cost} галлеонов`;
    item.appendChild(name);

    const buyBtn = document.createElement('button');
    buyBtn.textContent = 'Купить';
    buyBtn.disabled = !canBuy;
    buyBtn.className = canBuy ? 'can-buy' : 'cannot-buy';

    buyBtn.addEventListener('click', () => {
      if (galleons >= upgrade.cost && upgrade.level < upgrade.maxLevel) {
        galleons -= upgrade.cost;
        upgrade.level++;
        upgrade.cost = upgrade.baseCost * Math.pow(2, upgrade.level);

        if(key === 'wandUpgrade') {
          baseGain = 1 + upgrades.wandUpgrade.level;
        }

        if(key === 'autoClick' && level >= 2 && !autoClickInterval) {
          startAutoClick();
        }

        updateDisplay();
        renderShop();
        saveProgress();
      }
    });

    item.appendChild(buyBtn);

    shopTab.appendChild(item);
  });
}

// Вкладки

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if(btn.dataset.tab === 'leaderboard-tab') {
      leaderboardTab.classList.remove('hidden');
      shopTab.classList.add('hidden');
    } else if (btn.dataset.tab === 'shop-tab') {
      shopTab.classList.remove('hidden');
      leaderboardTab.classList.add('hidden');
    }
  });
});

// Ежедневный локальный рейтинг (для примера)

let dailyLeaderboard = JSON.parse(localStorage.getItem('hp_clicker_leaderboard')) || [];

function saveDailyLeaderboard() {
  // Добавляем или обновляем запись
  const index = dailyLeaderboard.findIndex(u => u.username === username);
  if(index !== -1) {
    if(dailyLeaderboard[index].galleons < galleons) {
      dailyLeaderboard[index].galleons = galleons;
    }
  } else {
    if(username) {
      dailyLeaderboard.push({username, galleons});
    }
  }
  // Сортируем по убыванию
  dailyLeaderboard.sort((a,b) => b.galleons - a.galleons);
  // Оставляем топ 10
  dailyLeaderboard = dailyLeaderboard.slice(0, 10);
  localStorage.setItem('hp_clicker_leaderboard', JSON.stringify(dailyLeaderboard));
  renderLeaderboard();
}

function renderLeaderboard() {
  leaderboardTab.innerHTML = '<h3>Топ игроков за сегодня</h3>';
  if(dailyLeaderboard.length === 0) {
    leaderboardTab.innerHTML += '<p>Пока нет данных</p>';
    return;
  }

  const list = document.createElement('ol');
  dailyLeaderboard.forEach(player => {
    const item = document.createElement('li');
    item.textContent = `${player.username || 'Аноним'} — ${player.galleons} галлеонов`;
    list.appendChild(item);
  });

  leaderboardTab.appendChild(list);
}

clickWandBtn.addEventListener('click', clickWand);

// Инициализация

loadProgress();
renderLeaderboard();
