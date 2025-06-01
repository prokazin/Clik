const galleonsCountEl = document.getElementById('galleons-count');
const levelCountEl = document.getElementById('level-count');
const clickWandBtn = document.getElementById('click-wand');

const tabLeaderboardBtn = document.getElementById('tab-leaderboard');
const tabShopBtn = document.getElementById('tab-shop');
const leaderboardEl = document.getElementById('leaderboard');
const shopEl = document.getElementById('shop');
const achievementsEl = document.getElementById('achievements');

let galleons = 0;
let level = 1;
const maxLevel = 4;

let autclickInterval = null;

// Магазинные улучшения
const upgrades = {
  wandPower: { level: 0, maxLevel: 5, basePrice: 10, price: 10, power: 1 },
  lumos: { level: 0, maxLevel: 5, basePrice: 50, price: 50, autoClickSpeed: 3000 },
  accio: { level: 0, maxLevel: 5, basePrice: 30, price: 30, bonusChance: 0.15 },
  avada: { level: 0, maxLevel: 5, basePrice: 100, price: 100, drainAmount: 10 },
};

const username = window.Telegram?.WebApp?.initDataUnsafe?.user?.username || 'Игрок';

// Убираем приветствие, ничего не ставим в username
// const usernameEl = document.getElementById('username');
// usernameEl.textContent = `Привет, ${username}!`;

function loadProgress() {
  const saved = localStorage.getItem('hp_clicker_progress');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      galleons = data.galleons || 0;
      level = data.level || 1;
      if(data.upgrades) {
        for(const key in upgrades) {
          if(data.upgrades[key] !== undefined) {
            upgrades[key].level = data.upgrades[key].level || 0;
            upgrades[key].price = data.upgrades[key].price || upgrades[key].basePrice * Math.pow(2, upgrades[key].level);
          }
        }
      }
    } catch {
      galleons = 0;
      level = 1;
    }
  }
  updateDisplay();
  renderShop();
}

function saveProgress() {
  const data = {
    galleons,
    level,
    upgrades,
  };
  localStorage.setItem('hp_clicker_progress', JSON.stringify(data));
  saveDailyLeaderboard();
}

function updateDisplay() {
  galleonsCountEl.textContent = galleons;
  levelCountEl.textContent = level;
}

function clickWand() {
  const baseGain = 1 + upgrades.wandPower.level; // Больше уровень - больше галлеонов за клик
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

  let posY = rect.top;
  let opacity = 1;
  const anim = setInterval(() => {
    posY -= 2;
    opacity -= 0.05;
    effect.style.top = `${posY}px`;
    effect.style.opacity = opacity;
    if(opacity <= 0) {
      clearInterval(anim);
      effect.remove();
    }
  }, 30);
}

function checkLevelUp() {
  const needed = level * 100;
  if (galleons >= needed) {
    level++;
    showAchievement(`Ты достиг уровня ${level}!`);
    updateDisplay();
  }
}

function showAchievement(text) {
  achievementsEl.textContent = text;
  setTimeout(() => {
    achievementsEl.textContent = '';
  }, 3000);
}

// Автоклик по уровню Люмос
function startAutoClick() {
  if (autclickInterval) clearInterval(autclickInterval);
  if (upgrades.lumos.level > 0) {
    autclickInterval = setInterval(() => {
      galleons += upgrades.lumos.level; 
      updateDisplay();
      saveProgress();
    }, upgrades.lumos.basePrice * (6 - upgrades.lumos.level) * 500); // Чем выше уровень, тем чаще
  }
}

// Таблица лидеров - пример локального рейтинга (замена на реальный сервер возможна)
function getLeaderboard() {
  const leaderboard = JSON.parse(localStorage.getItem('hp_clicker_leaderboard') || '[]');
  return leaderboard.sort((a, b) => b.galleons - a.galleons).slice(0, 10);
}

function saveDailyLeaderboard() {
  const leaderboard = JSON.parse(localStorage.getItem('hp_clicker_leaderboard') || '[]');
  const index = leaderboard.findIndex(u => u.username === username);
  if(index !== -1) {
    if(galleons > leaderboard[index].galleons) leaderboard[index].galleons = galleons;
  } else {
    leaderboard.push({ username, galleons });
  }
  localStorage.setItem('hp_clicker_leaderboard', JSON.stringify(leaderboard));
  renderLeaderboard();
}

function renderLeaderboard() {
  const leaderboard = getLeaderboard();
  if(leaderboard.length === 0) {
    leaderboardEl.innerHTML = '<p>Пока нет игроков</p>';
    return;
  }
  leaderboardEl.innerHTML = '<table><thead><tr><th>Место</th><th>Игрок</th><th>Галлеоны</th></tr></thead><tbody>' +
    leaderboard.map((player, i) => {
      return `<tr${player.username === username ? ' style="font-weight:bold; color:#7a5;"' : ''}>
        <td>${i+1}</td><td>${player.username}</td><td>${player.galleons}</td>
      </tr>`;
    }).join('') +
    '</tbody></table>';
}

// Магазин
function renderShop() {
  shopEl.innerHTML = '';

  // Палочка
  const wandUpg = upgrades.wandPower;
  const wandBtn = document.createElement('button');
  wandBtn.textContent = `Улучшить палочку (ур. ${wandUpg.level}/${wandUpg.maxLevel}) - Цена: ${wandUpg.price} галлеонов`;
  wandBtn.disabled = galleons < wandUpg.price || wandUpg.level >= wandUpg.maxLevel;
  wandBtn.onclick = () => {
    if (galleons >= wandUpg.price && wandUpg.level < wandUpg.maxLevel) {
      galleons -= wandUpg.price;
      wandUpg.level++;
      wandUpg.price = Math.floor(wandUpg.basePrice * Math.pow(2, wandUpg.level));
      showAchievement('Палочка стала сильнее!');
      updateDisplay();
      renderShop();
      saveProgress();
    }
  };
  shopEl.appendChild(wandBtn);

  // Другие улучшения
  Object.entries(upgrades).forEach(([key, upg]) => {
    if(key === 'wandPower') return; // уже отрисовали выше
    const btn = document.createElement('button');
    btn.textContent = `Улучшить ${key.charAt(0).toUpperCase() + key.slice(1)} (ур. ${upg.level}/${upg.maxLevel}) - Цена: ${upg.price} галлеонов`;
    btn.disabled = galleons < upg.price || upg.level >= upg.maxLevel;
    btn.onclick = () => {
      if(galleons >= upg.price && upg.level < upg.maxLevel) {
        galleons -= upg.price;
        upg.level++;
        upg.price = Math.floor(upg.basePrice * Math.pow(2, upg.level));
        showAchievement(`${key.charAt(0).toUpperCase() + key.slice(1)} улучшено!`);
        updateDisplay();
        renderShop();
        if(key === 'lumos') startAutoClick();
        saveProgress();
      }
    };
    shopEl.appendChild(btn);
  });
}

function switchTab(tab) {
  if(tab === 'leaderboard') {
    leaderboardEl.classList.remove('hidden');
    shopEl.classList.add('hidden');
    tabLeaderboardBtn.classList.add('active');
    tabShopBtn.classList.remove('active');
  } else {
    leaderboardEl.classList.add('hidden');
    shopEl.classList.remove('hidden');
    tabLeaderboardBtn.classList.remove('active');
    tabShopBtn.classList.add('active');
  }
}

// Обработчики вкладок
tabLeaderboardBtn.onclick = () => switchTab('leaderboard');
tabShopBtn.onclick = () => switchTab('shop');

// Обработчик клика по палочке
clickWandBtn.onclick = clickWand;

loadProgress();
saveDailyLeaderboard();
startAutoClick();
switchTab('leaderboard');
