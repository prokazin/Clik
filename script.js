const galleonsCountEl = document.getElementById('galleons-count');
const levelCountEl = document.getElementById('level-count');
const clickWandBtn = document.getElementById('click-wand');
const btnShop = document.getElementById('btn-shop');
const btnLeaderboard = document.getElementById('btn-leaderboard');
const leaderboardEl = document.getElementById('leaderboard');
const shopEl = document.getElementById('shop');
const achievementsEl = document.getElementById('achievements');
const usernameEl = document.getElementById('username');

// Игровые переменные
let galleons = 0;
let level = 1;
const maxLevel = 5;
const levelThresholds = [0, 50, 150, 400, 1000, 2500];
let lastClickTime = 0;
let tabActive = true;
let autclickInterval = null;

// Система улучшений
const upgrades = {
  wand: { level: 0, basePrice: 10, effect: 1 },
  spellbook: { level: 0, basePrice: 50, effect: 5 },
  owl: { level: 0, basePrice: 200, effect: 20 }
};

// Telegram или стандартный ник
const username = window.Telegram?.WebApp?.initDataUnsafe?.user?.username || 'Игрок';
usernameEl.textContent = username;

// Слушатели событий
window.addEventListener('blur', () => tabActive = false);
window.addEventListener('focus', () => tabActive = true);
btnShop.addEventListener('click', toggleShop);
btnLeaderboard.addEventListener('click', toggleLeaderboard);
clickWandBtn.addEventListener('click', clickWand);

// Инициализация игры
loadProgress();

// =============== ОСНОВНЫЕ ФУНКЦИИ ===============

function loadProgress() {
  const saved = localStorage.getItem('hp_clicker_progress');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      galleons = data.galleons || 0;
      level = data.level || 1;
      
      // Загрузка улучшений
      if (data.upgrades) {
        Object.keys(data.upgrades).forEach(key => {
          if (upgrades[key]) upgrades[key].level = data.upgrades[key].level || 0;
        });
      }
      
      // Автокликер для сохранённых уровней
      if (level >= 2) startAutoClick(level >= 3 ? 2000 : 3000);
    } catch {
      resetProgress();
    }
  }
  updateDisplay();
}

function saveProgress() {
  try {
    const data = {
      galleons,
      level,
      upgrades: JSON.parse(JSON.stringify(upgrades)),
      timestamp: Date.now()
    };
    localStorage.setItem('hp_clicker_progress', JSON.stringify(data));
    saveDailyLeaderboard();
  } catch (e) {
    console.error('Ошибка сохранения:', e);
  }
}

function resetProgress() {
  galleons = 0;
  level = 1;
  Object.keys(upgrades).forEach(key => upgrades[key].level = 0);
  if (autclickInterval) clearInterval(autclickInterval);
  autclickInterval = null;
  updateDisplay();
}

function updateDisplay() {
  galleonsCountEl.textContent = galleons;
  levelCountEl.textContent = level;
}

function clickWand() {
  // Защита от быстрых кликов
  const now = Date.now();
  if (now - lastClickTime < 100) {
    galleons = Math.floor(galleons * 0.9);
    showAchievement("Не жульничай!");
    return;
  }
  lastClickTime = now;

  // Базовый доход с учётом улучшений
  let baseGain = 1;
  Object.keys(upgrades).forEach(key => {
    baseGain += upgrades[key].level * upgrades[key].effect;
  });

  // Случайный множитель
  const chance = Math.random() * (1 + upgrades.wand.level * 0.2);
  let multiplier = 1;
  
  if (chance < 0.05) multiplier = 10; // Критический удар
  else if (chance < 0.15) multiplier = 5;
  else if (chance < 0.3) multiplier = 4;
  else if (chance < 0.5) multiplier = 3;
  else if (chance < 0.7) multiplier = 2;

  const gain = baseGain * multiplier;
  galleons += gain;

  // Эффекты
  if (multiplier === 10) {
    document.body.classList.add('critical-hit');
    setTimeout(() => document.body.classList.remove('critical-hit'), 500);
  }
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

  let start = null;
  const duration = 1000;
  
  function animate(timestamp) {
    if (!start) start = timestamp;
    const progress = (timestamp - start) / duration;
    
    effect.style.transform = `translateY(${-50 * progress}px) scale(${1 + 0.5 * progress})`;
    effect.style.opacity = 1 - progress;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      effect.remove();
    }
  }
  
  requestAnimationFrame(animate);
}

function checkLevelUp() {
  if (level < maxLevel && galleons >= levelThresholds[level]) {
    level++;
    
    if (level === 2) {
      startAutoClick(3000);
      showAchievement("Открыт автокликер!");
    } else if (level === 3) {
      startAutoClick(2000);
      showAchievement("Улучшенный автокликер!");
    } else if (level === maxLevel) {
      showAchievement("Максимальный уровень достигнут!");
    } else {
      showAchievement(`Уровень ${level} достигнут!`);
    }
    
    updateDisplay();
    saveProgress();
  }
}

function startAutoClick(interval) {
  if (autclickInterval) clearInterval(autclickInterval);
  autclickInterval = setInterval(() => {
    if (tabActive) {
      let baseGain = 1;
      Object.keys(upgrades).forEach(key => {
        baseGain += upgrades[key].level * upgrades[key].effect * 0.5; // Автоклик слабее
      });
      galleons += baseGain;
      updateDisplay();
      saveProgress();
    }
  }, interval);
}

// =============== МАГАЗИН ===============

function renderShop() {
  shopEl.innerHTML = `
    <h2>Магазин улучшений</h2>
    <div class="upgrade-item">
      <h3>Волшебная палочка</h3>
      <p>Уровень: ${upgrades.wand.level}</p>
      <p>Эффект: +${upgrades.wand.effect} за клик</p>
      <button id="btn-upgrade-wand" ${galleons < getUpgradePrice('wand') ? 'disabled' : ''}>
        Улучшить (${getUpgradePrice('wand')} галлеонов)
      </button>
    </div>
    <div class="upgrade-item">
      <h3>Учебник заклинаний</h3>
      <p>Уровень: ${upgrades.spellbook.level}</p>
      <p>Эффект: +${upgrades.spellbook.effect} за клик</p>
      <button id="btn-upgrade-spellbook" ${galleons < getUpgradePrice('spellbook') ? 'disabled' : ''}>
        Купить (${getUpgradePrice('spellbook')} галлеонов)
      </button>
    </div>
    <div class="upgrade-item">
      <h3>Почтовая сова</h3>
      <p>Уровень: ${upgrades.owl.level}</p>
      <p>Эффект: +${upgrades.owl.effect} за клик</p>
      <button id="btn-upgrade-owl" ${galleons < getUpgradePrice('owl') ? 'disabled' : ''}>
        Купить (${getUpgradePrice('owl')} галлеонов)
      </button>
    </div>
    <button id="btn-reset">Сбросить прогресс</button>
  `;

  document.getElementById('btn-upgrade-wand').onclick = () => upgradeItem('wand');
  document.getElementById('btn-upgrade-spellbook').onclick = () => upgradeItem('spellbook');
  document.getElementById('btn-upgrade-owl').onclick = () => upgradeItem('owl');
  document.getElementById('btn-reset').onclick = resetProgress;
}

function getUpgradePrice(item) {
  return upgrades[item].basePrice * Math.pow(2, upgrades[item].level);
}

function upgradeItem(item) {
  const price = getUpgradePrice(item);
  if (galleons >= price) {
    galleons -= price;
    upgrades[item].level++;
    updateDisplay();
    renderShop();
    saveProgress();
    showAchievement(`${item === 'wand' ? 'Палочка' : item === 'spellbook' ? 'Учебник' : 'Сова'} улучшена!`);
  }
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

// =============== РЕЙТИНГ ===============

function renderLeaderboard() {
  leaderboardEl.innerHTML = '<h2>Рейтинг игроков</h2>';
  const dailyLeaderboard = loadDailyLeaderboard();
  
  if (!dailyLeaderboard.length) {
    leaderboardEl.innerHTML += '<div>Нет данных</div>';
  } else {
    dailyLeaderboard.forEach((item, idx) => {
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

// =============== ЛИДЕРБОРД ===============

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
  const existing = leaderboard.find(item => item.name === username);

  if (existing) {
    if (galleons > existing.score) existing.score = galleons;
  } else {
    leaderboard.push({ name: username, score: galleons });
  }

  leaderboard.sort((a,b) => b.score - a.score);
  if (leaderboard.length > 10) leaderboard.length = 10;

  localStorage.setItem('hp_clicker_leaderboard', JSON.stringify(leaderboard));
}

// =============== ОБНОВЛЁННЫЙ МАГАЗИН ===============

const upgrades = {
  wand: {
    name: "Волшебная палочка",
    level: 0,
    maxLevel: 10,
    basePrice: 15,
    effect: 1,
    description: "Увеличивает базовый доход за клик"
  },
  spellbook: {
    name: "Учебник заклинаний",
    level: 0,
    maxLevel: 5,
    basePrice: 75,
    effect: 3,
    description: "Даёт бонус к каждому клику"
  },
  owl: {
    name: "Почтовая сова",
    level: 0,
    maxLevel: 3,
    basePrice: 200,
    effect: 10,
    description: "Приносит дополнительный доход"
  },
  potion: {
    name: "Зелье удачи",
    level: 0,
    maxLevel: 5,
    basePrice: 120,
    effect: 0.05,
    description: "Увеличивает шанс критического удара"
  }
};

function renderShop() {
  shopEl.innerHTML = `
    <h2>🏪 Магические улучшения</h2>
    <div class="shop-items">
      ${Object.entries(upgrades).map(([key, item]) => `
        <div class="upgrade-card">
          <h3>${item.name} ${item.level > 0 ? `(Ур. ${item.level})` : ''}</h3>
          <p>${item.description}</p>
          <div class="upgrade-progress">
            <div class="upgrade-progress-bar" style="width: ${(item.level / item.maxLevel) * 100}%"></div>
          </div>
          <p>Эффект: +${item.level * item.effect} ${key === 'potion' ? 'к шансу крита' : 'за клик'}</p>
          <button 
            id="btn-upgrade-${key}" 
            ${galleons < getUpgradePrice(key) || item.level >= item.maxLevel ? 'disabled' : ''}
          >
            ${item.level >= item.maxLevel ? 'Макс. уровень' : 
             `Улучшить (${getUpgradePrice(key)} галлеонов)`}
          </button>
        </div>
      `).join('')}
    </div>
  `;

  Object.keys(upgrades).forEach(key => {
    const btn = document.getElementById(`btn-upgrade-${key}`);
    if (btn) btn.onclick = () => upgradeItem(key);
  });
}

function getUpgradePrice(itemKey) {
  const item = upgrades[itemKey];
  return Math.floor(item.basePrice * Math.pow(1.8, item.level));
}

function upgradeItem(itemKey) {
  const item = upgrades[itemKey];
  const price = getUpgradePrice(itemKey);
  
  if (galleons >= price && item.level < item.maxLevel) {
    galleons -= price;
    item.level++;
    
    // Специальные эффекты при достижении уровней
    if (itemKey === 'wand' && item.level === 3) {
      showAchievement("Палочка излучает магическую энергию!");
    }
    
    updateDisplay();
    renderShop();
    saveProgress();
    showAchievement(`${item.name} улучшена до уровня ${item.level}!`);
  }
}

// =============== ОБНОВЛЁННЫЙ РЕЙТИНГ ===============

function renderLeaderboard() {
  const dailyLeaderboard = loadDailyLeaderboard();
  
  leaderboardEl.innerHTML = `
    <h2>🏆 Топ волшебников</h2>
    <div class="leaderboard-header">
      <span>Игрок</span>
      <span>Галлеоны</span>
    </div>
    ${dailyLeaderboard.map((player, index) => `
      <div class="leaderboard-entry">
        <div class="leaderboard-position">${index + 1}</div>
        <div class="leaderboard-player">
          <span class="leaderboard-name">${player.name || 'Анонимный маг'}</span>
          <span class="leaderboard-score">${player.score}</span>
        </div>
      </div>
    `).join('')}
    
    ${dailyLeaderboard.length === 0 ? 
      '<div class="leaderboard-entry">Пока никто не играл</div>' : ''}
    
    <div class="leaderboard-entry" style="margin-top: 15px; background: rgba(122, 165, 85, 0.2);">
      <div class="leaderboard-position">#</div>
      <div class="leaderboard-player">
        <span class="leaderboard-name">Ваш результат</span>
        <span class="leaderboard-score">${galleons}</span>
      </div>
    </div>
  `;
}

// =============== ОБНОВЛЁННАЯ ЛОГИКА КЛИКОВ ===============

function clickWand() {
  const now = Date.now();
  if (now - lastClickTime < 100) {
    galleons = Math.max(0, Math.floor(galleons * 0.8));
    showAchievement("Магия не терпит обмана! -20%");
    updateDisplay();
    return;
  }
  lastClickTime = now;

  // Базовый доход с учётом улучшений
  let baseGain = 1 + upgrades.wand.level * upgrades.wand.effect 
                + upgrades.spellbook.level * upgrades.spellbook.effect;

  // Случайный множитель с учётом зелья удачи
  const critChance = 0.05 + upgrades.potion.level * upgrades.potion.effect;
  let multiplier = 1;
  
  const roll = Math.random();
  if (roll < critChance * 0.3) multiplier = 10;
  else if (roll < critChance * 0.7) multiplier = 5;
  else if (roll < critChance) multiplier = 3;
  else if (roll < 0.5 + critChance * 0.5) multiplier = 2;

  const gain = Math.floor(baseGain * multiplier);
  galleons += gain;

  // Эффекты
  if (multiplier >= 5) {
    showCriticalEffect(multiplier);
  }
  showBonusEffect(gain, multiplier);

  checkLevelUp();
  updateDisplay();
  saveProgress();
}

function showCriticalEffect(multiplier) {
  const crit = document.createElement('div');
  crit.className = 'critical-effect';
  crit.innerHTML = `
    <div style="font-size: 2em; color: gold;">CRITICAL x${multiplier}!</div>
    <div style="position: absolute; width: 100%; height: 100%; 
         background: radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(255,215,0,0) 70%);
         pointer-events: none;"></div>
  `;
  
  document.body.appendChild(crit);
  
  setTimeout(() => {
    crit.style.opacity = '0';
    setTimeout(() => crit.remove(), 1000);
  }, 500);
}

// =============== ДОСТИЖЕНИЯ ===============

function showAchievement(text) {
  achievementsEl.textContent = text;
  setTimeout(() => {
    if (achievementsEl.textContent === text) {
      achievementsEl.textContent = '';
    }
  }, 3500);
}
