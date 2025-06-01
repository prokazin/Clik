// DOM элементы
const elements = {
  galleonsCount: document.getElementById('galleons-count'),
  levelCount: document.getElementById('level-count'),
  clickWand: document.getElementById('click-wand'),
  btnShop: document.getElementById('btn-shop'),
  btnSpells: document.getElementById('btn-spells'),
  btnLeaderboard: document.getElementById('btn-leaderboard'),
  shop: document.getElementById('shop'),
  spells: document.getElementById('spells'),
  leaderboard: document.getElementById('leaderboard'),
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
  maxLevel: 5,
  levelThresholds: [0, 50, 150, 400, 1000, 2500],
  faculty: null,
  faculties: {
    griffindor: {
      name: "Гриффиндор",
      bonus: "Критический удар x3 чаще",
      effect: (baseChance) => baseChance * 3
    },
    slytherin: {
      name: "Слизерин",
      bonus: "+20% к доходу от улучшений",
      effect: (baseValue) => Math.floor(baseValue * 1.2)
    },
    ravenclaw: {
      name: "Когтевран",
      bonus: "-15% стоимость улучшений",
      effect: (basePrice) => Math.floor(basePrice * 0.85)
    },
    hufflepuff: {
      name: "Пуффендуй",
      bonus: "+25% эффективность автокликера",
      effect: (baseValue) => Math.floor(baseValue * 1.25)
    }
  },
  spells: {
    lumos: {
      name: "Люмос",
      description: "Увеличивает доход на 50% на 30 секунд",
      cost: 100,
      unlocked: false,
      active: false,
      duration: 30,
      cooldown: 120,
      lastUsed: 0,
      effect: () => {
        gameState.spellMultiplier = 1.5;
        setTimeout(() => {
          gameState.spellMultiplier = 1;
        }, 30000);
      }
    },
    wingardium: {
      name: "Вингардиум Левиоса",
      description: "Удваивает скорость автокликера на 20 секунд",
      cost: 150,
      unlocked: false,
      active: false,
      duration: 20,
      cooldown: 90,
      lastUsed: 0,
      effect: () => {
        const originalInterval = gameState.autoClickInterval;
        clearInterval(gameState.autoClickInterval);
        gameState.autoClickInterval = setInterval(() => {
          autoClick();
        }, originalInterval._idleTimeout / 2);
        
        setTimeout(() => {
          clearInterval(gameState.autoClickInterval);
          gameState.autoClickInterval = setInterval(() => {
            autoClick();
          }, originalInterval._idleTimeout);
        }, 20000);
      }
    }
  },
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
  lastClickTime: 0,
  autoClickInterval: null,
  totalClicks: 0,
  spellMultiplier: 1
};

// Инициализация игры
function initGame() {
  hideAllModals();
  loadProgress();
  setupEventListeners();
  updateDisplay();
  
  // Показываем выбор факультета если не выбран
  if (!gameState.faculty) {
    showModal(elements.facultyOverlay);
  }
}

function hideAllModals() {
  document.querySelectorAll('.overlay').forEach(el => {
    el.classList.remove('active');
  });
}

function showModal(modal) {
  hideAllModals();
  modal.classList.add('active');
}

// Загрузка прогресса
function loadProgress() {
  const saved = localStorage.getItem('hp_clicker_progress');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      gameState.galleons = Math.floor(data.galleons) || 0;
      gameState.level = data.level || 1;
      gameState.faculty = data.faculty || null;
      
      if (data.upgrades) {
        Object.keys(data.upgrades).forEach(key => {
          if (gameState.upgrades[key]) {
            gameState.upgrades[key].level = data.upgrades[key].level || 0;
          }
        });
      }
      
      if (data.spells) {
        Object.keys(data.spells).forEach(key => {
          if (gameState.spells[key]) {
            gameState.spells[key].unlocked = data.spells[key].unlocked || false;
            gameState.spells[key].lastUsed = data.spells[key].lastUsed || 0;
          }
        });
      }
      
      if (gameState.level >= 2) {
        startAutoClick(gameState.level >= 3 ? 2000 : 3000);
      }
    } catch (e) {
      console.error("Ошибка загрузки:", e);
      resetProgress();
    }
  }
}

// Сохранение прогресса
function saveProgress() {
  const data = {
    galleons: gameState.galleons,
    level: gameState.level,
    faculty: gameState.faculty,
    upgrades: gameState.upgrades,
    spells: gameState.spells,
    timestamp: Date.now()
  };
  localStorage.setItem('hp_clicker_progress', JSON.stringify(data));
  saveLeaderboard();
}

// Обновление интерфейса
function updateDisplay() {
  elements.galleonsCount.textContent = Math.floor(gameState.galleons);
  elements.levelCount.textContent = gameState.level;
  
  if (gameState.faculty) {
    elements.facultyDisplay.textContent = `Факультет: ${gameState.faculties[gameState.faculty].name}`;
  } else {
    elements.facultyDisplay.textContent = '';
  }
}

// Обработка клика по палочке
function handleWandClick() {
  const now = Date.now();
  if (now - gameState.lastClickTime < 100) return;
  
  gameState.lastClickTime = now;
  gameState.totalClicks++;

  let baseGain = 1;
  Object.values(gameState.upgrades).forEach(upgrade => {
    baseGain += upgrade.level * upgrade.effect;
  });

  // Применяем эффект факультета
  if (gameState.faculty === 'slytherin') {
    baseGain = gameState.faculties.slytherin.effect(baseGain);
  }

  const multiplier = getRandomMultiplier() * gameState.spellMultiplier;
  const gain = Math.floor(baseGain * multiplier);
  gameState.galleons += gain;

  showBonusEffect(gain, multiplier);
  checkLevelUp();
  updateDisplay();
  saveProgress();
}

// Случайный множитель с учетом факультета
function getRandomMultiplier() {
  let baseChance = 0.05;
  
  // Эффект Гриффиндора
  if (gameState.faculty === 'griffindor') {
    baseChance = gameState.faculties.griffindor.effect(baseChance);
  }

  const roll = Math.random();
  if (roll < baseChance) return 5;
  if (roll < baseChance * 3) return 3;
  if (roll < 0.4) return 2;
  return 1;
}

// Проверка уровня
function checkLevelUp() {
  if (gameState.level < gameState.maxLevel && 
      gameState.galleons >= gameState.levelThresholds[gameState.level]) {
    gameState.level++;
    
    // Разблокировка заклинаний
    if (gameState.level >= 2) {
      gameState.spells.lumos.unlocked = true;
    }
    if (gameState.level >= 3) {
      gameState.spells.wingardium.unlocked = true;
    }
    
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

// Автокликер с учетом факультета
function startAutoClick(interval) {
  if (gameState.autoClickInterval) {
    clearInterval(gameState.autoClickInterval);
  }
  
  // Эффект Пуффендуя
  if (gameState.faculty === 'hufflepuff') {
    interval = Math.floor(interval / 1.25);
  }
  
  gameState.autoClickInterval = setInterval(() => {
    autoClick();
  }, interval);
}

function autoClick() {
  let baseGain = 1;
  Object.values(gameState.upgrades).forEach(upgrade => {
    baseGain += upgrade.level * upgrade.effect * 0.5;
  });
  
  // Эффект Слизерина
  if (gameState.faculty === 'slytherin') {
    baseGain = gameState.faculties.slytherin.effect(baseGain);
  }
  
  gameState.galleons += Math.floor(baseGain * gameState.spellMultiplier);
  updateDisplay();
  saveProgress();
}

// Магазин улучшений
function renderShop() {
  elements.shop.innerHTML = `
    <h2>Магазин улучшений</h2>
    ${Object.entries(gameState.upgrades).map(([key, item]) => {
      let price = getUpgradePrice(key);
      // Эффект Когтеврана
      if (gameState.faculty === 'ravenclaw') {
        price = gameState.faculties.ravenclaw.effect(price);
      }
      
      return `
        <div class="upgrade-card">
          <h3>${item.name} (Ур. ${item.level})</h3>
          <p>${item.description}</p>
          <button 
            id="buy-${key}" 
            ${gameState.galleons < price ? 'disabled' : ''}
          >
            Улучшить (${price} галлеонов)
          </button>
        </div>
      `;
    }).join('')}
  `;

  Object.keys(gameState.upgrades).forEach(key => {
    const btn = document.getElementById(`buy-${key}`);
    if (btn) {
      btn.addEventListener('click', () => buyUpgrade(key));
    }
  });
}

// Покупка улучшения
function buyUpgrade(key) {
  let price = getUpgradePrice(key);
  // Эффект Когтеврана
  if (gameState.faculty === 'ravenclaw') {
    price = gameState.faculties.ravenclaw.effect(price);
  }
  
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

// Заклинания
function renderSpells() {
  elements.spells.innerHTML = `
    <h2>Заклинания</h2>
    ${Object.entries(gameState.spells).map(([key, spell]) => {
      const cooldownLeft = Math.max(0, spell.lastUsed + spell.cooldown * 1000 - Date.now());
      const canCast = spell.unlocked && !spell.active && cooldownLeft <= 0;
      
      return `
        <div class="spell-card ${spell.active ? 'active' : ''} ${cooldownLeft > 0 ? 'cooldown' : ''}">
          <h3>${spell.name}</h3>
          <p>${spell.description}</p>
          <p>Стоимость: ${spell.cost} галлеонов</p>
          ${cooldownLeft > 0 ? 
            `<p>Восстановление: ${Math.ceil(cooldownLeft/1000)}сек</p>` : ''}
          <button 
            id="cast-${key}" 
            ${!canCast || gameState.galleons < spell.cost ? 'disabled' : ''}
          >
            ${spell.active ? 'Активно' : 'Произнести'}
          </button>
        </div>
      `;
    }).join('')}
  `;

  Object.keys(gameState.spells).forEach(key => {
    const btn = document.getElementById(`cast-${key}`);
    if (btn) {
      btn.addEventListener('click', () => castSpell(key));
    }
  });
}

// Произнесение заклинания
function castSpell(spellKey) {
  const spell = gameState.spells[spellKey];
  if (!spell.unlocked || spell.active || 
      gameState.galleons < spell.cost || 
      Date.now() - spell.lastUsed < spell.cooldown * 1000) {
    return;
  }

  gameState.galleons -= spell.cost;
  spell.active = true;
  spell.lastUsed = Date.now();
  
  // Активируем эффект заклинания
  spell.effect();
  
  // Деактивация после времени действия
  setTimeout(() => {
    spell.active = false;
    renderSpells();
    showAchievement(`Заклинание ${spell.name} закончилось`);
  }, spell.duration * 1000);
  
  updateDisplay();
  renderSpells();
  saveProgress();
  showAchievement(`Заклинание ${spell.name} активировано!`);
}

// Таблица лидеров
function renderLeaderboard() {
  const leaderboard = loadLeaderboard();
  elements.leaderboard.innerHTML = `
    <h2>Топ магов</h2>
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
  const playerName = gameState.faculty ? gameState.faculties[gameState.faculty].name : "Маг";
  const existingIndex = leaderboard.findIndex(p => p.name === playerName);

  if (existingIndex >= 0) {
    if (gameState.galleons > leaderboard[existingIndex].score) {
      leaderboard[existingIndex].score = gameState.galleons;
    }
  } else {
    leaderboard.push({ 
      name: playerName, 
      score: gameState.galleons 
    });
  }

  leaderboard.sort((a, b) => b.score - a.score);
  if (leaderboard.length > 10) leaderboard.length = 10;
  localStorage.setItem('hp_clicker_leaderboard', JSON.stringify(leaderboard));
}

// Загрузка рейтинга
function loadLeaderboard() {
  const data = localStorage.getItem('hp_clicker_leaderboard');
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Ошибка загрузки рейтинга:", e);
    return [];
  }
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
    gameState.faculty = null;
    Object.keys(gameState.upgrades).forEach(key => {
      gameState.upgrades[key].level = 0;
    });
    Object.keys(gameState.spells).forEach(key => {
      gameState.spells[key].unlocked = false;
      gameState.spells[key].active = false;
    });
    
    if (gameState.autoClickInterval) {
      clearInterval(gameState.autoClickInterval);
      gameState.autoClickInterval = null;
    }
    
    updateDisplay();
    saveProgress();
    showAchievement("Прогресс сброшен!");
  }
}

// Настройка событий
function setupEventListeners() {
  // Закрытие модальных окон
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      hideAllModals();
    });
  });

  // Выбор факультета
  document.querySelectorAll('.faculty-choice').forEach(choice => {
    choice.addEventListener('click', () => {
      const faculty = choice.dataset.faculty;
      gameState.faculty = faculty;
      updateDisplay();
      hideAllModals();
      showAchievement(`Добро пожаловать в ${gameState.faculties[faculty].name}!`);
      saveProgress();
    });
  });

  // Открытие магазина
  elements.btnShop.addEventListener('click', () => {
    renderShop();
    showModal(elements.shopOverlay);
  });

  // Открытие заклинаний
  elements.btnSpells.addEventListener('click', () => {
    renderSpells();
    showModal(elements.spellsOverlay);
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
