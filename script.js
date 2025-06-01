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
  hideAllModals();
  elements.username.textContent = window.Telegram?.WebApp?.initDataUnsafe?.user?.username || '';
  loadProgress();
  setupEventListeners();
}

function hideAllModals() {
  elements.shopOverlay.classList.remove('active');
  elements.leaderboardOverlay.classList.remove('active');
}

function showModal(modal) {
  hideAllModals();
  modal.classList.add('active');
}

// Остальные функции остаются без изменений...

// Настройка событий
function setupEventListeners() {
  // Закрытие модальных окон
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      hideAllModals();
    });
  });

  // Закрытие по клику вне окна
  [elements.shopOverlay, elements.leaderboardOverlay].forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        hideAllModals();
      }
    });
  });

  // Открытие магазина
  elements.btnShop.addEventListener('click', () => {
    renderShop();
    showModal(elements.shopOverlay);
  });

  // Открытие рейтинга
  elements.btnLeaderboard.addEventListener('click', () => {
    renderLeaderboard();
    showModal(elements.leaderboardOverlay);
  });

  // Клик по палочке
  elements.clickWand.addEventListener('click', handleWandClick);
}

// Запуск игры
document.addEventListener('DOMContentLoaded', initGame);
