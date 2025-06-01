// DOM элементы
const elements = {
  galleonsCount: document.getElementById('galleons-count'),
  levelCount: document.getElementById('level-count'),
  clickWand: document.getElementById('click-wand'),
  btnShop: document.getElementById('btn-shop'),
  btnSpells: document.getElementById('btn-spells'),
  btnLeaderboard: document.getElementById('btn-leaderboard'),
  shopContent: document.getElementById('shop-content'),
  spellsContent: document.getElementById('spells-content'),
  leaderboardContent: document.getElementById('leaderboard-content'),
  achievements: document.getElementById('achievements'),
  facultyDisplay: document.getElementById('faculty-display'),
  shopOverlay: document.getElementById('shop-overlay'),
  spellsOverlay: document.getElementById('spells-overlay'),
  facultyOverlay: document.getElementById('faculty-overlay'),
  leaderboardOverlay: document.getElementById('leaderboard-overlay')
};

// Игровые данные
const gameState = {
  galleons: 0,
  level: 1,
  faculty: null,
  upgrades: {
    wand: { level: 0, basePrice: 15, effect: 1, name: "Волшебная палочка" },
    spellbook: { level: 0, basePrice: 75, effect: 3, name: "Учебник заклинаний" },
    owl: { level: 0, basePrice: 200, effect: 10, name: "Почтовая сова" }
  }
};

// Инициализация игры
function initGame() {
  setupEventListeners();
  updateDisplay();
  
  if (!gameState.faculty) {
    elements.facultyOverlay.classList.remove('hidden');
  }
}

// Обновление интерфейса
function updateDisplay() {
  elements.galleonsCount.textContent = gameState.galleons;
  elements.levelCount.textContent = gameState.level;
  
  if (gameState.faculty) {
    elements.facultyDisplay.textContent = `Факультет: ${gameState.faculty}`;
  }
}

// Обработчики событий
function setupEventListeners() {
  // Клик по палочке
  elements.clickWand.addEventListener('click', () => {
    gameState.galleons += 1 + getUpgradeBonus();
    updateDisplay();
  });

  // Кнопки интерфейса
  elements.btnShop.addEventListener('click', () => {
    renderShop();
    elements.shopOverlay.classList.remove('hidden');
  });

  elements.btnSpells.addEventListener('click', () => {
    renderSpells();
    elements.spellsOverlay.classList.remove('hidden');
  });

  elements.btnLeaderboard.addEventListener('click', () => {
    renderLeaderboard();
    elements.leaderboardOverlay.classList.remove('hidden');
  });

  // Закрытие модальных окон
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.overlay').classList.add('hidden');
    });
  });

  // Выбор факультета
  document.querySelectorAll('.faculty-choice').forEach(choice => {
    choice.addEventListener('click', () => {
      gameState.faculty = choice.dataset.faculty;
      elements.facultyOverlay.classList.add('hidden');
      updateDisplay();
    });
  });
}

// Рендер магазина
function renderShop() {
  elements.shopContent.innerHTML = Object.entries(gameState.upgrades)
    .map(([key, upgrade]) => `
      <div class="upgrade-item">
        <h3>${upgrade.name} (Ур. ${upgrade.level})</h3>
        <p>+${upgrade.effect} галлеонов за клик</p>
        <button class="buy-btn" data-upgrade="${key}">
          Купить (${getUpgradePrice(key)} галлеонов)
        </button>
      </div>
    `).join('');

  document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const upgradeKey = e.target.dataset.upgrade;
      buyUpgrade(upgradeKey);
    });
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
  }
}

// Цена улучшения
function getUpgradePrice(key) {
  const upgrade = gameState.upgrades[key];
  return Math.floor(upgrade.basePrice * Math.pow(1.5, upgrade.level));
}

// Бонус от улучшений
function getUpgradeBonus() {
  return Object.values(gameState.upgrades)
    .reduce((sum, upgrade) => sum + (upgrade.level * upgrade.effect), 0);
}

// Рендер заклинаний
function renderSpells() {
  elements.spellsContent.innerHTML = `
    <div class="spell-item">
      <h3>Заклинания будут доступны на 2 уровне!</h3>
    </div>
  `;
}

// Рендер рейтинга
function renderLeaderboard() {
  elements.leaderboardContent.innerHTML = `
    <div class="leaderboard-item">
      <h3>Ваш результат: ${gameState.galleons} галлеонов</h3>
    </div>
  `;
}

// Запуск игры
document.addEventListener('DOMContentLoaded', initGame);
