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
  galleons: 100,
  level: 1,
  maxLevel: 10,
  faculty: null,
  upgrades: {
    wand: { 
      level: 0, 
      basePrice: 15, 
      effect: 1, 
      name: "Волшебная палочка", 
      description: "+1 галлеон за уровень" 
    },
    spellbook: { 
      level: 0, 
      basePrice: 75, 
      effect: 3, 
      name: "Учебник заклинаний", 
      description: "+3 галлеона за уровень" 
    },
    owl: { 
      level: 0, 
      basePrice: 200, 
      effect: 10, 
      name: "Почтовая сова", 
      description: "+10 галлеонов за уровень" 
    }
  },
  spells: {
    lumos: {
      name: "Люмос",
      description: "+50% к доходу на 10 кликов",
      cost: 100,
      unlocked: false,
      active: false,
      effect: () => {
        gameState.spellMultiplier = 1.5;
        showAchievement("Активировано: Люмос!");
      }
    },
    wingardium: {
      name: "Вингардиум Левиоса",
      description: "Дает 50 галлеонов сразу",
      cost: 150,
      unlocked: false,
      active: false,
      effect: () => {
        gameState.galleons += 50;
        updateDisplay();
        showAchievement("+50 галлеонов!");
      }
    }
  },
  spellMultiplier: 1,
  totalClicks: 0,
  autoClicker: null
};

// Инициализация игры
function initGame() {
  setupEventListeners();
  updateDisplay();
  
  // Показываем выбор факультета если не выбран
  if (!gameState.faculty) {
    showModal(elements.facultyOverlay);
  }
  
  // Разблокируем заклинания при достижении уровня
  checkSpellsUnlock();
}

// Показ модального окна
function showModal(modalElement) {
  modalElement.classList.remove('hidden');
}

// Скрытие модального окна
function hideModal(modalElement) {
  modalElement.classList.add('hidden');
}

// Обновление интерфейса
function updateDisplay() {
  elements.galleonsCount.textContent = gameState.galleons;
  elements.levelCount.textContent = gameState.level;
  
  if (gameState.faculty) {
    elements.facultyDisplay.textContent = `Факультет: ${gameState.faculty}`;
  }
}

// Обработка клика по палочке
function handleWandClick() {
  let baseGain = 1;
  
  // Добавляем бонус от улучшений
  Object.values(gameState.upgrades).forEach(upgrade => {
    baseGain += upgrade.level * upgrade.effect;
  });
  
  // Применяем множитель заклинаний
  const totalGain = Math.floor(baseGain * gameState.spellMultiplier);
  gameState.galleons += totalGain;
  gameState.totalClicks++;
  
  // Сбрасываем множитель после 10 кликов
  if (gameState.spellMultiplier > 1 && gameState.totalClicks % 10 === 0) {
    gameState.spellMultiplier = 1;
    showAchievement("Эффект заклинания закончился");
  }
  
  updateDisplay();
  checkLevelUp();
}

// Проверка уровня
function checkLevelUp() {
  const neededGalleons = gameState.level * 100;
  if (gameState.galleons >= neededGalleons && gameState.level < gameState.maxLevel) {
    gameState.level++;
    showAchievement(`Достигнут уровень ${gameState.level}!`);
    checkSpellsUnlock();
    updateDisplay();
  }
}

// Разблокировка заклинаний
function checkSpellsUnlock() {
  if (gameState.level >= 2) {
    gameState.spells.lumos.unlocked = true;
  }
  if (gameState.level >= 3) {
    gameState.spells.wingardium.unlocked = true;
  }
}

// Магазин улучшений
function renderShop() {
  elements.shopContent.innerHTML = Object.entries(gameState.upgrades)
    .map(([key, upgrade]) => {
      const price = calculateUpgradePrice(key);
      const canAfford = gameState.galleons >= price;
      
      return `
        <div class="upgrade-item">
          <h3>${upgrade.name} (ур. ${upgrade.level})</h3>
          <p>${upgrade.description}</p>
          <button 
            class="buy-btn" 
            data-upgrade="${key}" 
            ${!canAfford ? 'disabled' : ''}
          >
            Купить (${price} галлеонов)
          </button>
        </div>
      `;
    }).join('');
    
  // Назначение обработчиков кнопок покупки
  document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const upgradeKey = e.target.dataset.upgrade;
      buyUpgrade(upgradeKey);
    });
  });
}

// Покупка улучшения
function buyUpgrade(upgradeKey) {
  const price = calculateUpgradePrice(upgradeKey);
  
  if (gameState.galleons >= price) {
    gameState.galleons -= price;
    gameState.upgrades[upgradeKey].level++;
    updateDisplay();
    renderShop();
    showAchievement(`Улучшено: ${gameState.upgrades[upgradeKey].name}!`);
  }
}

// Расчет цены улучшения
function calculateUpgradePrice(upgradeKey) {
  const upgrade = gameState.upgrades[upgradeKey];
  return Math.floor(upgrade.basePrice * Math.pow(1.5, upgrade.level));
}

// Заклинания
function renderSpells() {
  elements.spellsContent.innerHTML = Object.entries(gameState.spells)
    .map(([key, spell]) => {
      const canCast = spell.unlocked && !spell.active && gameState.galleons >= spell.cost;
      
      return `
        <div class="spell-item ${spell.active ? 'active' : ''}">
          <h3>${spell.name}</h3>
          <p>${spell.description}</p>
          <p>Стоимость: ${spell.cost} галлеонов</p>
          <button 
            class="cast-btn" 
            data-spell="${key}" 
            ${!canCast ? 'disabled' : ''}
          >
            ${spell.active ? 'Активно' : 'Произнести'}
          </button>
        </div>
      `;
    }).join('');
    
  // Назначение обработчиков кнопок заклинаний
  document.querySelectorAll('.cast-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const spellKey = e.target.dataset.spell;
      castSpell(spellKey);
    });
  });
}

// Использование заклинания
function castSpell(spellKey) {
  const spell = gameState.spells[spellKey];
  
  if (gameState.galleons >= spell.cost && !spell.active) {
    gameState.galleons -= spell.cost;
    spell.active = true;
    spell.effect();
    updateDisplay();
    renderSpells();
  }
}

// Таблица лидеров
function renderLeaderboard() {
  elements.leaderboardContent.innerHTML = `
    <div class="leaderboard-item">
      <h3>Топ игроков</h3>
      <p>1. Вы - ${gameState.galleons} галлеонов</p>
      <p>2. Профессор Дамблдор - 10000</p>
      <p>3. Гарри Поттер - 5000</p>
    </div>
  `;
}

// Показ достижений
function showAchievement(text) {
  elements.achievements.textContent = text;
  setTimeout(() => {
    elements.achievements.textContent = '';
  }, 3000);
}

// Обработчики событий
function setupEventListeners() {
  // Клик по палочке
  elements.clickWand.addEventListener('click', handleWandClick);
  
  // Кнопки интерфейса
  elements.btnShop.addEventListener('click', () => {
    renderShop();
    showModal(elements.shopOverlay);
  });
  
  elements.btnSpells.addEventListener('click', () => {
    renderSpells();
    showModal(elements.spellsOverlay);
  });
  
  elements.btnLeaderboard.addEventListener('click', () => {
    renderLeaderboard();
    showModal(elements.leaderboardOverlay);
  });
  
  // Закрытие модальных окон
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      hideModal(e.target.closest('.overlay'));
    });
  });
  
  // Выбор факультета
  document.querySelectorAll('.faculty-choice').forEach(choice => {
    choice.addEventListener('click', () => {
      gameState.faculty = choice.dataset.faculty;
      hideModal(elements.facultyOverlay);
      updateDisplay();
      showAchievement(`Добро пожаловать в ${gameState.faculty}!`);
    });
  });
}

// Запуск игры
document.addEventListener('DOMContentLoaded', initGame);
