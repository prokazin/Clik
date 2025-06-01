const tg = window.Telegram.WebApp;
tg.expand();

const usernameEl = document.getElementById('username');
const galleonCountEl = document.getElementById('galleon-count');
const clickWandBtn = document.getElementById('click-wand');
const critEffectEl = document.getElementById('crit-effect');
const buyLumosBtn = document.getElementById('buy-lumos');
const activateAccioBtn = document.getElementById('activate-accio');
const achievementListEl = document.getElementById('achievement-list');
const leaderListEl = document.getElementById('leader-list');
const loadLeaderboardBtn = document.getElementById('btn-load-leaderboard');
const closeBtn = document.getElementById('btn-close');

let galleons = 0;
let level = 1;
let lumosBought = false;
let accioActive = false;
let achievements = [];

usernameEl.textContent = tg.initDataUnsafe?.user?.username || 'Игрок';

function loadProgress() {
  const data = tg.getData('hp_clicker_progress');
  if (data) {
    try {
      const parsed = JSON.parse(data);
      galleons = parsed.galleons || 0;
      level = parsed.level || 1;
      lumosBought = parsed.lumosBought || false;
      accioActive = parsed.accioActive || false;
      achievements = parsed.achievements || [];
    } catch {}
  }
}

function saveProgress() {
  const data = {
    galleons,
    level,
    lumosBought,
    accioActive,
    achievements
  };
  tg.setData('hp_clicker_progress', JSON.stringify(data));
}

function updateUI() {
  galleonCountEl.textContent = galleons;
  buyLumosBtn.disabled = lumosBought || galleons < 50;
  activateAccioBtn.disabled = accioActive || galleons < 100;

  achievementListEl.innerHTML = '';
  if (achievements.length === 0) {
    achievementListEl.innerHTML = '<li>Пока нет достижений</li>';
  } else {
    achievements.forEach(a => {
      const li = document.createElement('li');
      li.textContent = a;
      achievementListEl.appendChild(li);
    });
  }
}

function getCritMultiplier() {
  const rand = Math.random();
  if (rand < 0.1) return 5;
  if (rand < 0.25) return 4;
  if (rand < 0.5) return 3;
  if (rand < 0.75) return 2;
  return 1;
}

function showCritEffect(multiplier) {
  if (multiplier === 1) return;
  critEffectEl.textContent = `x${multiplier}!`;
  critEffectEl.style.opacity = '1';
  setTimeout(() => {
    critEffectEl.style.opacity = '0';
  }, 1000);
}

clickWandBtn.onclick = () => {
  let multiplier = getCritMultiplier();
  let gain = 1 * multiplier;

  if (accioActive) gain *= 2;

  galleons += gain;

  if (galleons >= 100 && !achievements.includes('Собрал 100 галлеонов')) {
    achievements.push('Собрал 100 галлеонов');
  }

  showCritEffect(multiplier);
  updateUI();
  saveProgress();
};

let lumosInterval = null;

buyLumosBtn.onclick = () => {
  if (galleons < 50 || lumosBought) return;
  galleons -= 50;
  lumosBought = true;
  lumosInterval = setInterval(() => {
    galleons += 1;
    updateUI();
    saveProgress();
  }, 1000);
  updateUI();
  saveProgress();
};

activateAccioBtn.onclick = () => {
  if (galleons < 100 || accioActive) return;
  galleons -= 100;
  accioActive = true;
  updateUI();
  saveProgress();

  setTimeout(() => {
    accioActive = false;
    updateUI();
    saveProgress();
  }, 15000); // 15 секунд бонуса
};

loadLeaderboardBtn.onclick = () => {
  alert('Рейтинг пока не реализован без Firebase.');
  // Здесь можно будет подключить Telegram API или сервер для рейтинга
};

closeBtn.onclick = () => {
  tg.close();
};

loadProgress();
updateUI();
