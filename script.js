const galleonsCountEl = document.getElementById('galleons-count');
const levelCountEl = document.getElementById('level-count');
const clickWandBtn = document.getElementById('click-wand');
const showLeaderboardBtn = document.getElementById('show-leaderboard');
const showShopBtn = document.getElementById('show-shop');

const leaderboardModal = document.getElementById('leaderboard-modal');
const leaderboardEl = document.getElementById('leaderboard');
const closeLeaderboardBtn = document.getElementById('close-leaderboard');

const shopModal = document.getElementById('shop-modal');
const shopItemsEl = document.getElementById('shop-items');
const closeShopBtn = document.getElementById('close-shop');

const achievementsEl = document.getElementById('achievements');
const usernameEl = document.getElementById('username');

let galleons = 0;
let level = 1;
const maxLevel = 4;

let autoclickInterval = null;

const username = window.Telegram?.WebApp?.initDataUnsafe?.user?.username || 'Игрок';
usernameEl.textContent = `Привет, ${username}!`;

// Апгрейды
const upgrades = {
  lumos: {
    name: 'Люмос',
    description: 'Автоклик: +1 галлеон каждые 3 сек.',
    basePrice: 15,
    price: 15,
    level: 0,
    effectActive: false,
  },
  accio: {
    name: 'Акцио',
    description: 'Бонус к клику +1 галлеон на 30 секунд',
    basePrice: 25,
    price: 25,
    level: 0,
    effectActive: false,
    effectEndTime: 0,
  },
  avada: {
    name: 'Авада Кедавра',
    description: 'Атака на других (пока не реализовано)',
    basePrice: 100,
    price: 100,
    level: 0,
  },
};

const achievements = [];

function saveProgress() {
  const data = {
    galleons,
    level,
    upgrades: {
      lumos: upgrades.lumos.level,
      accio: upgrades.accio.level,
      avada: upgrades.avada.level,
    },
  };
  localStorage.setItem('hp-clicker-save', JSON.stringify(data));
}

function loadProgress() {
  const saved = localStorage.getItem('hp-clicker-save');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      galleons = data.galleons || 0;
      level = data.level || 1;
      upgrades.lumos.level = data.upgrades?.lumos || 0;
      upgrades.accio.level = data.upgrades?.accio || 0;
      upgrades.avada.level = data.upgrades?.avada || 0;
      recalcUpgrades();
    } catch {
      // ignore
    }
  }
}

function updateDisplay() {
  galleonsCountEl.textContent = galleons;
  levelCountEl.textContent = level;
}

function recalcUpgrades() {
  // Пересчёт цены по уровню (пример экспоненциального роста)
  for (const key in upgrades) {
    upgrades[key].price = Math.floor(upgrades[key].basePrice * Math.pow(1.5, upgrades[key].level));
  }
  // Автоклик Люмос
  if (upgrades.lumos.level > 0 && !upgrades.lumos.effectActive) {
    startAutoclick();
  } else if (upgrades.lumos.level === 0) {
    stopAutoclick();
  }
}

function startAutoclick() {
  if (autoclickInterval) return;
  upgrades.lumos.effectActive = true;
  autoclickInterval = setInterval(() => {
    galleons += upgrades.lumos.level;
    showBonusEffect(`+${upgrades.lumos.level} (Люмос)`);
    updateDisplay();
    saveProgress();
  }, 3000);
}

function stopAutoclick() {
  if (autoclickInterval) {
    clearInterval(autoclickInterval);
    autoclickInterval = null;
  }
  upgrades.lumos.effectActive = false;
}

function showBonusEffect(text) {
  const effectEl = document.createElement('div');
  effectEl.classList.add('bonus-effect');
  effectEl.textContent = text;
  effectEl.style.left = `${clickWandBtn.getBoundingClientRect().left + 20}px`;
  effectEl.style.top = `${clickWandBtn.getBoundingClientRect().top}px`;
  document.body.appendChild(effectEl);
  setTimeout(() => {
    effectEl.remove();
  }, 1500);
}

function onClickWand() {
  // Случайный множитель x1-5
  const multiplier = Math.floor(Math.random() * 5) + 1;
  let gain = multiplier;

  // Проверка бонуса Акцио (добавляет +1 на 30 сек)
  if (upgrades.accio.effectActive && Date.now() < upgrades.accio.effectEndTime) {
    gain += upgrades.accio.level; // каждый уровень добавляет +1
  } else if (upgrades.accio.effectActive) {
    upgrades.accio.effectActive = false;
  }

  galleons += gain;
  showBonusEffect(`+${gain}`);
  updateDisplay();
  saveProgress();
}

function openLeaderboard() {
  renderLeaderboard();
  leaderboardModal.classList.remove('hidden');
}

function closeLeaderboard() {
  leaderboardModal.classList.add('hidden');
}

function openShop() {
  renderShop();
  shopModal.classList.remove('hidden');
}

function closeShop() {
  shopModal.classList.add('hidden');
}

function renderLeaderboard() {
  // Пример локального рейтинга (можно заменить на Firebase или сервер)
  // Топ 5 фиктивных игроков для примера
  const topPlayers = [
    { name: 'Гарри', score: 150 },
    { name: username, score: galleons },
    { name: 'Гермиона', score: 120 },
    { name: 'Рон', score: 80 },
    { name: 'Дамблдор', score: 50 },
  ];

  // Сортируем по убыванию
  topPlayers.sort((a,b) => b.score - a.score);

  let html = '<ol>';
  topPlayers.forEach(p => {
    html += `<li>${p.name}: ${p.score} галлеонов</li>`;
  });
  html += '</ol>';

  leaderboardEl.innerHTML = html;
}

function renderShop() {
  shopItemsEl.innerHTML = '';
  for (const key in upgrades) {
    const upg = upgrades[key];
    const item = document.createElement('div');
    item.classList.add('shop-item');

    const info = document.createElement('div');
    info.innerHTML = `<strong>${upg.name}</strong> — ${upg.description}<br>Уровень: ${upg.level} | Цена: ${upg.price} галлеонов`;

    const buyBtn = document.createElement('button');
    buyBtn.textContent = 'Купить';
    buyBtn.disabled = galleons < upg.price;
    buyBtn.addEventListener('click', () => buyUpgrade(key));

    item.appendChild(info);
    item.appendChild(buyBtn);

    shopItemsEl.appendChild(item);
  }
}

function buyUpgrade(key) {
  const upg = upgrades[key];
  if (galleons >= upg.price) {
    galleons -= upg.price;
    upg.level++;
    // Пересчитать цену с ростом
    upg.price = Math.floor(upg.basePrice * Math.pow(1.5, upg.level));

    // Активируем эффекты сразу при покупке
    if (key === 'lumos') {
      recalcUpgrades();
    } else if (key === 'accio') {
      upgrades.accio.effectActive = true;
      upgrades.accio.effectEndTime = Date.now() + 30_000; // 30 секунд
    }

    updateDisplay();
    renderShop();
    saveProgress();
  }
}

clickWandBtn.addEventListener('click', onClickWand);
showLeaderboardBtn.addEventListener('click', openLeaderboard);
closeLeaderboardBtn.addEventListener('click', closeLeaderboard);

showShopBtn.addEventListener('click', openShop);
closeShopBtn.addEventListener('click', closeShop);

// Загрузка прогресса и запуск
loadProgress();
updateDisplay();
recalcUpgrades();
