// Инициализация переменных
let galleons = 0;

const galleonsEl = document.getElementById('galleons');
const wandLevelEl = document.getElementById('wand-level');
const wandEl = document.getElementById('wand');
const shopEl = document.getElementById('shop');
const leaderboardEl = document.getElementById('leaderboard');

const btnShop = document.getElementById('btn-shop');
const btnLeaderboard = document.getElementById('btn-leaderboard');

const tabs = {
  shop: shopEl,
  leaderboard: leaderboardEl
};

// Данные об апгрейдах с уровнями и ценами
const upgrades = {
  wandPower: {
    level: 0,
    basePrice: 50,
    price: 50,
    maxLevel: 10
  },
  lumos: {
    level: 0,
    basePrice: 100,
    price: 100,
    maxLevel: 5
  },
  accio: {
    level: 0,
    basePrice: 200,
    price: 200,
    maxLevel: 5
  },
  avada: {
    level: 0,
    basePrice: 500,
    price: 500,
    maxLevel: 3
  }
};

// Обновление отображения статистики
function updateDisplay() {
  galleonsEl.textContent = galleons;
  wandLevelEl.textContent = upgrades.wandPower.level;
}

// Рендер магазина: показывает уровень и цену каждого улучшения
function renderShop() {
  shopEl.innerHTML = '';
  Object.entries(upgrades).forEach(([key, upg]) => {
    const item = document.createElement('div');
    item.style.marginBottom = '10px';

    const canBuy = galleons >= upg.price && upg.level < upg.maxLevel;
    const btn = document.createElement('button');
    btn.textContent = `Купить (${upg.price} галлеонов)`;
    btn.disabled = !canBuy;

    btn.addEventListener('click', () => {
      if (galleons >= upg.price && upg.level < upg.maxLevel) {
        galleons -= upg.price;
        upg.level++;
        upg.price = Math.floor(upg.basePrice * Math.pow(2, upg.level));
        updateDisplay();
        renderShop();
        saveProgress();
      }
    });

    item.innerHTML = `<b>${formatUpgradeName(key)}</b>: уровень ${upg.level}/${upg.maxLevel} `;
    item.appendChild(btn);
    shopEl.appendChild(item);
  });
}

// Форматирование названия апгрейда
function formatUpgradeName(key) {
  switch (key) {
    case 'wandPower': return 'Сила палочки';
    case 'lumos': return 'Люмос';
    case 'accio': return 'Акцио';
    case 'avada': return 'Авада Кедавра';
    default: return key;
  }
}

// Рендер таблицы лидеров с ODE Finder на первом месте без слова "улучшить"
function renderLeaderboard() {
  const leaderboard = getLeaderboard();

  if (leaderboard.length === 0) {
    leaderboardEl.innerHTML = '<p>Пока нет игроков</p>';
    return;
  }

  leaderboardEl.innerHTML = '<table><thead><tr><th>Место</th><th>Игрок</th><th>Галлеоны</th></tr></thead><tbody>' +
    `<tr style="font-weight:bold; color:#7a5;">
       <td>1</td><td>ODE Finder</td><td>${leaderboard[0] ? leaderboard[0].galleons : 0}</td>
     </tr>` +
    leaderboard.slice(1, 10).map((player, i) => {
      return `<tr>
        <td>${i + 2}</td><td>${player.username}</td><td>${player.galleons}</td>
      </tr>`;
    }).join('') +
    '</tbody></table>';
}

// Пример мок-данных рейтинга игроков
function getLeaderboard() {
  return [
    { username: 'Player1', galleons: 1500 },
    { username: 'Player2', galleons: 1200 },
    { username: 'Player3', galleons: 900 },
    { username: 'Player4', galleons: 700 }
  ];
}

// Клик по палочке — начисляем галлеоны с учётом уровня палочки
wandEl.addEventListener('click', () => {
  let gain = 1 + upgrades.wandPower.level * 2;
  galleons += gain;
  updateDisplay();
  renderShop();
  saveProgress();
});

// Переключение вкладок
btnShop.addEventListener('click', () => {
  showTab('shop');
});

btnLeaderboard.addEventListener('click', () => {
  showTab('leaderboard');
});

function showTab(name) {
  Object.entries(tabs).forEach(([key, el]) => {
    if (key === name) {
      el.classList.remove('hidden');
      if (key === 'shop') renderShop();
      else if (key === 'leaderboard') renderLeaderboard();
    } else {
      el.classList.add('hidden');
    }
  });
}

// Сохраняем прогресс в localStorage
function saveProgress() {
  const data = {
    galleons,
    upgrades
  };
  localStorage.setItem('hogwartsClickerSave', JSON.stringify(data));
}

// Загружаем прогресс из localStorage
function loadProgress() {
  const data = JSON.parse(localStorage.getItem('hogwartsClickerSave'));
  if (data) {
    galleons = data.galleons || 0;
    Object.keys(upgrades).forEach(key => {
      if (data.upgrades && data.upgrades[key]) {
        upgrades[key].level = data.upgrades[key].level || 0;
        upgrades[key].price = data.upgrades[key].price || upgrades[key].basePrice;
      }
    });
  }
}

// Запуск игры
loadProgress();
updateDisplay();
showTab('shop');
