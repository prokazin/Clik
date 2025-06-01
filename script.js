// DOM элементы
const elements = {
  galleonsCount: document.getElementById('galleons-count'),
  levelCount: document.getElementById('level-count'),
  clickWand: document.getElementById('click-wand'),
  btnShop: document.getElementById('btn-shop'),
  btnLeaderboard: document.getElementById('btn-leaderboard'),
  shop: document.getElementById('shop'),
  leaderboard: document.getElementById('leaderboard'),
  achievements: document.getElementById('achievements'),
  username: document.getElementById('username'),
  shopOverlay: document.getElementById('shop-overlay'),
  leaderboardOverlay: document.getElementById('leaderboard-overlay')
};

// Игровые данные
const gameState = {
  galleons: 0,
  level: 1,
  maxLevel: 5,
  levelThresholds: [0, 50, 150, 400, 1000, 2500],
  upgrades: {
    wand: { level: 0, basePrice: 15, effect: 1, name: "Волшебная палочка", description: "+1 галлеон за уровень" },
    spellbook: { level: 0, basePrice: 75, effect: 3, name: "Учебник заклинаний", description: "+3 галлеона за уровень" },
    owl: { level: 0, basePrice: 200, effect: 10, name: "Почтовая сова", description: "+10 галлеонов за уровень" }
  },
  lastClickTime: 0,
  autoClickInterval: null
};

// Инициализация игры
function initGame() {
  elements.username.textContent = window.Telegram?.WebApp?.initDataUnsafe?.user?.username || '';
  loadProgress();
  setupEventListeners();
}

// Загрузка прогресса
function loadProgress() {
  const saved = localStorage.getItem('hp_clicker_progress');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      gameState.galleons = Math.floor(data.galleons) || 0;
      gameState.level = data.level || 1;
      
      if (data.upgrades) {
        Object.keys(data.upgrades).forEach(key => {
          if (gameState.upgrades[key]) {
            gameState.upgrades[key].level = data.upgrades[key].level || 0;
          }
        });
      }
      
      if (gameState.level >= 2) startAutoClick(gameState.level >= 3 ? 2000 : 3000);
    } catch {
      resetProgress();
    }
  }
  updateDisplay();
}

// Сохранение прогресса
function saveProgress() {
  const data = {
    galleons: gameState.galleons,
    level: gameState.level,
    upgrades: gameState.upgrades,
    timestamp: Date.now()
  };
  localStorage.setItem('hp_clicker_progress', JSON.stringify(data));
  saveLeaderboard();
}

// Обновление интерфейса
function updateDisplay() {
  elements.galleonsCount.textContent = Math.floor(gameState.galleons);
  elements.levelCount.textContent = gameState.level;
}

// Обработка клика по палочке
function handleWandClick() {
  const now = Date.now();
  if (now - gameState.lastClickTime < 100) return;
  gameState.lastClickTime = now;

  let baseGain = 1;
  Object.values(gameState.upgrades).forEach(upgrade => {
    baseGain += upgrade.level * upgrade.effect;
  });

  const multiplier = getRandomMultiplier();
  const gain = Math.floor(baseGain * multiplier);
  gameState.galleons += gain;

  showBonusEffect(gain, multiplier);
  checkLevelUp();
  updateDisplay();
  saveProgress();
}

// Случайный множитель
function getRandomMultiplier() {
  const roll = Math.random();
  if (roll < 0.05) return 5;
  if (roll < 0.15) return 3;
  if (roll < 0.4) return 2;
  return 1;
}

// Проверка уровня
function checkLevelUp() {
  if (gameState.level < gameState.maxLevel && 
      gameState.galleons >= gameState.levelThresholds[gameState.level]) {
    gameState.level++;
    
    if (gameState.level === 2) {
      startAutoClick(3000);
      showAchievement("Открыт автокликер!");
    } else if (gameState.level === 3) {
      startAutoClick(2000);
      showAchievement("Улучшенный автокликер!");
    } else {
      showAchievement(`Уровень ${gameState.level} достигнут!`);
    }
    
    updateDisplay();
    saveProgress();
  }
}

// Автокликер
function startAutoClick(interval) {
  if (gameState.autoClickInterval) clearInterval(gameState.autoClickInterval);
  gameState.autoClickInterval = setInterval(() => {
    let baseGain = 1;
    Object.values(gameState.upgrades).forEach(upgrade => {
      baseGain += upgrade.level * upgrade.effect * 0.5;
    });
    gameState.galleons += Math.floor(baseGain);
    updateDisplay();
    saveProgress();
  }, interval);
}

// Магазин улучшений
function renderShop() {
  elements.shop.innerHTML = `
    <h2>Магазин улучшений</h2>
    ${Object.entries(gameState.upgrades).map(([key, item]) => `
      <div class="upgrade-card">
        <h3>${item.name} (Ур. ${item.level})</h3>
        <p>${item.description}</p>
        <button 
          id="buy-${key}" 
          ${gameState.galleons < getUpgradePrice(key) ? 'disabled' : ''}
        >
          Улучшить (${getUpgradePrice(key)} галлеонов)
        </button>
      </div>
    `).join('')}
  `;

  Object.keys(gameState.upgrades).forEach(key => {
    document.getElementById(`buy-${key}`)?.addEventListener('click', () => buyUpgrade(key));
  });
}

// Покупка улучшения
function buyUpgrade(key) {
  const price = getUpgradePrice(key);
  if (gameState.galleons >= price) {
    gameState.galleons -= price;
    gameState.upgrades[key].level++;
    updateDisplay();
    renderShop();
    saveProgress();
    showAchievement(`${gameState.upgrades[key].name} улучшена!`);
  }
}

// Цена улучшения
function getUpgradePrice(key) {
  const item = gameState.upgrades[key];
  return Math.floor(item.basePrice * Math.pow(1.8, item.level));
}

// Таблица лидеров
function renderLeaderboard() {
  const leaderboard = loadLeaderboard();
  elements.leaderboard.innerHTML = `
    <h2>Топ игроков</h2>
    ${leaderboard.map((player, index) => `
      <div class="leaderboard-entry">
        <span>${index + 1}. ${player.name}</span>
        <span>${Math.floor(player.score)}</span>
      </div>
    `).join('')}
  `;
}

// Сохранение в рейтинг
function saveLeaderboard() {
  const leaderboard = loadLeaderboard();
  const username = elements.username.textContent || 'Игрок';
  const existingIndex = leaderboard.findIndex(p => p.name === username);

  if (existingIndex >= 0) {
    if (gameState.galleons > leaderboard[existingIndex].score) {
      leaderboard[existingIndex].score = gameState.galleons;
    }
  } else {
    leaderboard.push({ name: username, score: gameState.galleons });
  }

  leaderboard.sort((a, b) => b.score - a.score);
  if (leaderboard.length > 10) leaderboard.length = 10;
  localStorage.setItem('hp_clicker_leaderboard', JSON.stringify(leaderboard));
}

// Загрузка рейтинга
function loadLeaderboard() {
  const data = localStorage.getItem('hp_clicker_leaderboard');
  return data ? JSON.parse(data) : [];
}

// Показать достижение
function showAchievement(text) {
  elements.achievements.textContent = text;
  setTimeout(() => {
    if (elements.achievements.textContent === text) {
      elements.achievements.textContent = '';
    }
  }, 3500);
}

// Эффект бонуса
function showBonusEffect(gain, multiplier) {
  const effect = document.createElement('div');
  effect.className = 'bonus-effect';
  effect.textContent = `+${gain}${multiplier > 1 ? ` (x${multiplier})` : ''}`;
  
  const rect = elements.clickWand.getBoundingClientRect();
  effect.style.left = `${rect.left + rect.width / 2}px`;
  effect.style.top = `${rect.top}px`;
  
  document.body.appendChild(effect);
  setTimeout(() => effect.remove(), 1000);
}

// Сброс прогресса
function resetProgress() {
  if (confirm("Вы точно хотите сбросить весь прогресс?")) {
    gameState.galleons = 0;
    gameState.level = 1;
    Object.keys(gameState.upgrades).forEach(key => {
      gameState.upgrades[key].level = 0;
    });
    updateDisplay();
    saveProgress();
  }
}

// Настройка событий
function setupEventListeners() {
  // Закрытие модальных окон
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
    });
  });

  // Открытие магазина
  elements.btnShop.addEventListener('click', () => {
    renderShop();
    elements.shopOverlay.classList.remove('hidden');
  });

  // Открытие рейтинга
  elements.btnLeaderboard.addEventListener('click', () => {
    renderLeaderboard();
    elements.leaderboardOverlay.classList.remove('hidden');
  });

  // Клик по палочке
  elements.clickWand.addEventListener('click', handleWandClick);
}

// Запуск игры
initGame();
