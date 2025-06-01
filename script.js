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

// Инициализация игры
const username = window.Telegram?.WebApp?.initDataUnsafe?.user?.username || 'Игрок';
usernameEl.textContent = username;

// Слушатели событий
window.addEventListener('blur', () => tabActive = false);
window.addEventListener('focus', () => tabActive = true);
btnShop.addEventListener('click', toggleShop);
btnLeaderboard.addEventListener('click', toggleLeaderboard);
clickWandBtn.addEventListener('click', clickWand);

loadProgress();

// ==================== ОСНОВНЫЕ ФУНКЦИИ ====================

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
  if (confirm("Вы точно хотите сбросить весь прогресс?")) {
    galleons = 0;
    level = 1;
    Object.keys(upgrades).forEach(key => upgrades[key].level = 0);
    if (autclickInterval) clearInterval(autclickInterval);
    autclickInterval = null;
    updateDisplay();
    saveProgress();
    showAchievement("Прогресс сброшен!");
  }
}

function updateDisplay() {
  galleonsCountEl.textContent = galleons;
  levelCountEl.textContent = level;
}

function clickWand() {
  // Защита от быстрых кликов
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

// ==================== МАГАЗИН УЛУЧШЕНИЙ ====================

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
    <button id="btn-reset" style="margin-top: 20px; background-color: #d33;">
      Сбросить прогресс
    </button>
  `;

  Object.keys(upgrades).forEach(key => {
    const btn = document.getElementById(`btn-upgrade-${key}`);
    if (btn) btn.onclick = () => upgradeItem(key);
  });

  document.getElementById('btn-reset').onclick = resetProgress;
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

function toggleShop() {
  if (shopEl.classList.contains('hidden')) {
    renderShop();
    shopEl.classList.remove('hidden');
    leaderboardEl.classList.add('hidden');
  } else {
    shopEl.classList.add('hidden');
  }
}

// ==================== СИСТЕМА РЕЙТИНГА ====================

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

function toggleLeaderboard() {
  if (leaderboardEl.classList.contains('hidden')) {
    renderLeaderboard();
    leaderboardEl.classList.remove('hidden');
    shopEl.classList.add('hidden');
  } else {
    leaderboardEl.classList.add('hidden');
  }
}

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

// ==================== СИСТЕМА ДОСТИЖЕНИЙ ====================

function showAchievement(text) {
  achievementsEl.textContent = text;
  achievementsEl.style.animation = 'none';
  void achievementsEl.offsetWidth; // Trigger reflow
  achievementsEl.style.animation = 'fadeInOut 3.5s forwards';
  
  setTimeout(() => {
    if (achievementsEl.textContent === text) {
      achievementsEl.textContent = '';
    }
  }, 3500);
}

// Добавьте это в ваш CSS:
/*
@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(20px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-20px); }
}
*/
