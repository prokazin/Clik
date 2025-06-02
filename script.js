// DOM элементы
const elements = {
  galleonsCount: document.getElementById('galleons-count'),
  levelCount: document.getElementById('level-count'),
  clickWand: document.getElementById('click-wand'),
  btnShop: document.getElementById('btn-shop'),
  btnSpells: document.getElementById('btn-spells'),
  btnSkills: document.getElementById('btn-skills'),
  btnLeaderboard: document.getElementById('btn-leaderboard'),
  btnReset: document.getElementById('btn-reset'),
  shopContent: document.getElementById('shop-content'),
  spellsContent: document.getElementById('spells-content'),
  skillsContent: document.getElementById('skills-content'),
  leaderboardContent: document.getElementById('leaderboard-content'),
  achievements: document.getElementById('achievements'),
  facultyDisplay: document.getElementById('faculty-display'),
  shopOverlay: document.getElementById('shop-overlay'),
  spellsOverlay: document.getElementById('spells-overlay'),
  skillsOverlay: document.getElementById('skills-overlay'),
  facultyOverlay: document.getElementById('faculty-overlay'),
  leaderboardOverlay: document.getElementById('leaderboard-overlay'),
  wandEffects: document.getElementById('wand-effects')
};

// Игровые данные
const gameState = {
  galleons: 0,
  level: 1,
  maxLevel: 10,
  levelThresholds: [0, 50, 150, 400, 1000, 2500, 5000, 10000, 25000, 50000],
  faculty: null,
  faculties: {
    griffindor: {
      name: "Гриффиндор",
      bonus: "+30% шанс критического удара",
      effect: (baseChance) => baseChance * 1.3
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
      description: "+50% к доходу на 30 секунд",
      cost: 100,
      unlocked: false,
      active: false,
      duration: 30,
      cooldown: 120,
      lastUsed: 0,
      effect: () => {
        gameState.spellMultiplier = 1.5;
        showAchievement("Яркий свет Люмос освещает ваш путь!");
        createSpellEffect('lumos');
      }
    },
    wingardium: {
      name: "Вингардиум Левиоса",
      description: "Удваивает доход от автокликера на 20 секунд",
      cost: 150,
      unlocked: false,
      active: false,
      duration: 20,
      cooldown: 90,
      lastUsed: 0,
      effect: () => {
        gameState.autoClickBoost = 2;
        showAchievement("Предметы парят в воздухе!");
        createSpellEffect('wingardium');
      }
    },
    expelliarmus: {
      name: "Экспеллиармус",
      description: "Мгновенно дает 200 галлеонов",
      cost: 300,
      unlocked: false,
      active: false,
      cooldown: 180,
      effect: () => {
        gameState.galleons += 200;
        showAchievement("Золото улетает прямиком в ваш карман!");
        createSpellEffect('expelliarmus');
        updateDisplay();
      }
    }
  },
  skills: {
    accuracy: {
      name: "Точность",
      description: "Увеличивает шанс критического удара",
      level: 0,
      maxLevel: 10,
      cost: (level) => 100 + level * 50,
      effect: (level) => 0.02 + level * 0.008
    },
    speed: {
      name: "Скорость",
      description: "Уменьшает время между автокликами",
      level: 0,
      maxLevel: 5,
      cost: (level) => 200 + level * 100,
      effect: (level) => 1 - level * 0.08
    },
    magicPower: {
      name: "Сила магии",
      description: "Увеличивает множитель критического удара",
      level: 0,
      maxLevel: 5,
      cost: (level) => 300 + level * 150,
      effect: (level) => 1 + level * 0.2
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
  autoClickBoost: 1,
  totalClicks: 0,
  criticalHits: 0,
  spellMultiplier: 1
};

// Инициализация игры
function initGame() {
  loadProgress();
  setupEventListeners();
  updateDisplay();
  
  if (!gameState.faculty) {
    showModal(elements.facultyOverlay);
  } else {
    createFacultyEffect();
  }
}

function createFacultyEffect() {
  const effect = document.createElement('div');
  effect.className = 'faculty-effect';
  elements.wandEffects.appendChild(effect);
}

function createSpellEffect(type) {
  const effect = document.createElement('div');
  effect.className = `spell-effect-overlay ${type}-effect`;
  document.body.appendChild(effect);
  setTimeout(() => effect.remove(), 1000);
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
      
      if (data.skills) {
        Object.keys(data.skills).forEach(key => {
          if (gameState.skills[key]) {
            gameState.skills[key].level = data.skills[key].level || 0;
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
    skills: gameState.skills,
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
  }
}

// Создание визуальных эффектов
function createEffect(type, options = {}) {
  const effect = document.createElement('div');
  effect.className = `skill-effect-particle`;
  
  switch(type) {
    case 'sparkle':
      effect.style.width = '20px';
      effect.style.height = '20px';
      effect.style.background = 'radial-gradient(circle, gold 30%, transparent 70%)';
      effect.style.borderRadius = '50%';
      effect.style.left = `${options.x || 50}px`;
      effect.style.top = `${options.y || 50}px`;
      effect.style.animation = 'sparkle 0.8s forwards';
      break;
      
    case 'ripple':
      effect.style.width = '100px';
      effect.style.height = '100px';
      effect.style.border = '2px solid gold';
      effect.style.borderRadius = '50%';
      effect.style.left = `${(options.x || 50) - 50}px`;
      effect.style.top = `${(options.y || 50) - 50}px`;
      effect.style.animation = 'ripple 1s forwards';
      break;
      
    case 'critical':
      effect.className = 'critical-hit';
      effect.textContent = `CRIT! x${options.multiplier || 2}`;
      effect.style.left = `${options.x || 50}px`;
      effect.style.top = `${options.y || 50}px`;
      break;
  }
  
  elements.wandEffects.appendChild(effect);
  setTimeout(() => effect.remove(), 1000);
}

// Обработка клика по палочке
function handleWandClick(e) {
  const rect = elements.clickWand.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // Создаем базовые эффекты
  createEffect('sparkle', {x, y});
  if (Math.random() > 0.7) createEffect('ripple', {x, y});
  
  // Логика клика
  const now = Date.now();
  if (now - gameState.lastClickTime < 100) return;
  
  gameState.lastClickTime = now;
  gameState.totalClicks++;

  let baseGain = 1;
  Object.values(gameState.upgrades).forEach(upgrade => {
    baseGain += upgrade.level * upgrade.effect;
  });

  // Критический удар
  const critChance = 0.05 + gameState.skills.accuracy.effect(gameState.skills.accuracy.level);
  const isCritical = Math.random() < critChance;
  let multiplier = 1;
  
  if (isCritical) {
    multiplier = 2 + gameState.skills.magicPower.effect(gameState.skills.magicPower.level);
    gameState.criticalHits++;
    createEffect('critical', {x: e.clientX, y: e.clientY, multiplier});
  }

  const totalGain = Math.floor(baseGain * multiplier * gameState.spellMultiplier);
  gameState.galleons += totalGain;

  showBonusEffect(totalGain, multiplier);
  checkLevelUp();
  updateDisplay();
  saveProgress();
}

// Показать бонусный эффект
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

// Проверка уровня
function checkLevelUp() {
  if (gameState.level < gameState.maxLevel && 
      gameState.galleons >= gameState.levelThresholds[gameState.level]) {
    gameState.level++;
    
    // Разблокировка заклинаний
    if (gameState.level >= 2) gameState.spells.lumos.unlocked = true;
    if (gameState.level >= 3) gameState.spells.wingardium.unlocked = true;
    if (gameState.level >= 4) gameState.spells.expelliarmus.unlocked = true;
    
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
function startAutoClick(baseInterval) {
  if (gameState.autoClickInterval) {
    clearInterval(gameState.autoClickInterval);
  }
  
  // Учитываем навык скорости
  let interval = baseInterval;
  if (gameState.skills.speed.level > 0) {
    interval *= gameState.skills.speed.effect(gameState.skills.speed.level);
  }
  
  // Учитываем факультет
  if (gameState.faculty === 'hufflepuff') {
    interval = gameState.faculties.hufflepuff.effect(interval);
  }
  
  gameState.autoClickInterval = setInterval(() => {
    autoClick();
    // Эффект автоклика
    const rect = elements.clickWand.getBoundingClientRect();
    createEffect('sparkle', {
      x: rect.left + rect.width/2,
      y: rect.top + rect.height/2
    });
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
  
  // Применяем все активные эффекты
  let totalGain = baseGain * gameState.spellMultiplier;
  if (gameState.autoClickBoost) totalGain *= gameState.autoClickBoost;
  
  gameState.galleons += Math.floor(totalGain);
  updateDisplay();
  saveProgress();
}

// Магазин улучшений
function renderShop() {
  elements.shopContent.innerHTML = `
    <h2>Магазин улучшений</h2>
    ${Object.entries(gameState.upgrades).map(([key, item]) => {
      let price = getUpgradePrice(key);
      // Эффект Когтеврана
      if (gameState.faculty === 'ravenclaw') {
        price = gameState.faculties.ravenclaw.effect(price);
      }
      
      return `
        <div class="upgrade-item">
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
  elements.spellsContent.innerHTML = `
    <h2>Заклинания</h2>
    ${Object.entries(gameState.spells).map(([key, spell]) => {
      const cooldownLeft = Math.max(0, spell.lastUsed + spell.cooldown * 1000 - Date.now());
      const canCast = spell.unlocked && !spell.active && cooldownLeft <= 0 && gameState.galleons >= spell.cost;
      
      return `
        <div class="spell-item ${key} ${spell.active ? 'active' : ''} ${cooldownLeft > 0 ? 'cooldown' : ''}">
          <h3>${spell.name}</h3>
          <p>${spell.description}</p>
          <p>Стоимость: ${spell.cost} галлеонов</p>
          ${cooldownLeft > 0 ? 
            `<p>Восстановление: ${Math.ceil(cooldownLeft/1000)}сек</p>` : ''}
          <button 
            id="cast-${key}" 
            ${!canCast ? 'disabled' : ''}
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

// Каст заклинания
function castSpell(key) {
  const spell = gameState.spells[key];
  
  if (!spell.unlocked || spell.active || 
      Date.now() - spell.lastUsed < spell.cooldown * 1000 ||
      gameState.galleons < spell.cost) {
    return;
  }
  
  gameState.galleons -= spell.cost;
  spell.lastUsed = Date.now();
  spell.active = true;
  
  // Применяем эффект
  spell.effect();
  
  // Завершаем эффект через duration
  if (spell.duration) {
    setTimeout(() => {
      spell.active = false;
      
      // Сбрасываем множители
      if (key === 'lumos') gameState.spellMultiplier = 1;
      if (key === 'wingardium') gameState.autoClickBoost = 1;
      
      renderSpells();
    }, spell.duration * 1000);
  } else {
    spell.active = false;
  }
  
  renderSpells();
  updateDisplay();
  saveProgress();
}

// Навыки
function renderSkills() {
  elements.skillsContent.innerHTML = `
    <h2>Навыки</h2>
    ${Object.entries(gameState.skills).map(([key, skill]) => {
      const cost = skill.cost(skill.level);
      const canUpgrade = skill.level < skill.maxLevel && gameState.galleons >= cost;
      
      return `
        <div class="skill-item">
          <h3>${skill.name} <span class="skill-level">${skill.level}/${skill.maxLevel}</span></h3>
          <p>${skill.description}</p>
          <p class="skill-effect">Текущий эффект: ${getSkillEffectDescription(key)}</p>
          <button 
            id="upgrade-${key}" 
            ${!canUpgrade ? 'disabled' : ''}
          >
            Улучшить (${cost} галлеонов)
          </button>
        </div>
      `;
    }).join('')}
  `;

  Object.keys(gameState.skills).forEach(key => {
    const btn = document.getElementById(`upgrade-${key}`);
    if (btn) {
      btn.addEventListener('click', () => upgradeSkill(key));
    }
  });
}

function getSkillEffectDescription(key) {
  const skill = gameState.skills[key];
  switch(key) {
    case 'accuracy':
      return `${Math.round((0.05 + skill.effect(skill.level)) * 100)}% шанс крита`;
    case 'speed':
      return `${Math.round((1 - skill.effect(skill.level)) * 100)}% ускорение`;
    case 'magicPower':
      return `x${(1 + skill.effect(skill.level)).toFixed(1)} множитель крита`;
    default:
      return '';
  }
}

function upgradeSkill(key) {
  const skill = gameState.skills[key];
  const cost = skill.cost(skill.level);
  
  if (skill.level < skill.maxLevel && gameState.galleons >= cost) {
    gameState.galleons -= cost;
    skill.level++;
    
    // Перезапускаем автокликер если улучшили скорость
    if (key === 'speed' && gameState.level >= 2) {
      startAutoClick(gameState.level >= 3 ? 2000 : 3000);
    }
    
    updateDisplay();
    renderSkills();
    saveProgress();
    showAchievement(`Навык "${skill.name}" улучшен до уровня ${skill.level}!`);
  }
}

// Таблица лидеров
function renderLeaderboard() {
  const leaderboard = getLeaderboard();
  elements.leaderboardContent.innerHTML = `
    <h2>Таблица лидеров</h2>
    <table class="leaderboard-table">
      <tr>
        <th>Место</th>
        <th>Игрок</th>
        <th>Уровень</th>
        <th>Галлеоны</th>
        <th>Факультет</th>
      </tr>
      ${leaderboard.map((entry, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${entry.name || 'Аноним'}</td>
          <td>${entry.level}</td>
          <td>${Math.floor(entry.galleons)}</td>
          <td>${entry.faculty ? gameState.faculties[entry.faculty].name : 'Не выбран'}</td>
        </tr>
      `).join('')}
    </table>
  `;
}

function getLeaderboard() {
  const saved = localStorage.getItem('hp_clicker_leaderboard');
  try {
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveLeaderboard() {
  const leaderboard = getLeaderboard();
  const playerData = {
    name: prompt("Введите ваше имя для таблицы лидеров:") || "Аноним",
    level: gameState.level,
    galleons: gameState.galleons,
    faculty: gameState.faculty,
    timestamp: Date.now()
  };
  
  // Добавляем или обновляем запись
  const existingIndex = leaderboard.findIndex(entry => entry.name === playerData.name);
  if (existingIndex >= 0) {
    leaderboard[existingIndex] = playerData;
  } else {
    leaderboard.push(playerData);
  }
  
  // Сортируем и обрезаем до топ-10
  leaderboard.sort((a, b) => b.level - a.level || b.galleons - a.galleons);
  const top10 = leaderboard.slice(0, 10);
  
  localStorage.setItem('hp_clicker_leaderboard', JSON.stringify(top10));
}

// Выбор факультета
function selectFaculty(faculty) {
  gameState.faculty = faculty;
  elements.facultyDisplay.textContent = `Факультет: ${gameState.faculties[faculty].name}`;
  hideModal(elements.facultyOverlay);
  createFacultyEffect();
  
  // Применяем бонусы факультета
  if (faculty === 'hufflepuff' && gameState.level >= 2) {
    startAutoClick(gameState.level >= 3 ? 2000 : 3000);
  }
  
  showAchievement(`Вы попали на факультет ${gameState.faculties[faculty].name}!`);
  saveProgress();
}

// Достижения
function showAchievement(text) {
  const achievement = document.createElement('div');
  achievement.className = 'achievement';
  achievement.textContent = text;
  
  elements.achievements.appendChild(achievement);
  setTimeout(() => {
    achievement.style.opacity = '0';
    setTimeout(() => achievement.remove(), 1000);
  }, 3000);
}

// Модальные окна
function showModal(element) {
  element.style.display = 'flex';
  setTimeout(() => element.style.opacity = '1', 10);
}

function hideModal(element) {
  element.style.opacity = '0';
  setTimeout(() => element.style.display = 'none', 300);
}

// Сброс прогресса
function resetProgress() {
  if (confirm("Вы уверены, что хотите сбросить весь прогресс?")) {
    localStorage.removeItem('hp_clicker_progress');
    localStorage.removeItem('hp_clicker_leaderboard');
    location.reload();
  }
}

// Настройка обработчиков событий
function setupEventListeners() {
  // Основные элементы
  elements.clickWand.addEventListener('click', handleWandClick);
  elements.btnReset.addEventListener('click', resetProgress);
  
  // Кнопки меню
  elements.btnShop.addEventListener('click', () => {
    renderShop();
    showModal(elements.shopOverlay);
  });
  
  elements.btnSpells.addEventListener('click', () => {
    renderSpells();
    showModal(elements.spellsOverlay);
  });
  
  elements.btnSkills.addEventListener('click', () => {
    renderSkills();
    showModal(elements.skillsOverlay);
  });
  
  elements.btnLeaderboard.addEventListener('click', () => {
    renderLeaderboard();
    showModal(elements.leaderboardOverlay);
  });
  
  // Кнопки закрытия модальных окон
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      hideModal(e.target.closest('.overlay'));
    });
  });
  
  // Выбор факультета
  document.querySelectorAll('.faculty-choice').forEach(btn => {
    btn.addEventListener('click', (e) => {
      selectFaculty(e.currentTarget.dataset.faculty);
    });
  });
  
  // Автосохранение каждые 30 секунд
  setInterval(saveProgress, 30000);
  
  // Обработка закрытия страницы
  window.addEventListener('beforeunload', saveProgress);
}

// Инициализация при загрузке
window.addEventListener('DOMContentLoaded', initGame);
