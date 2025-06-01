const tg = window.Telegram?.WebApp;
tg?.ready();

const user = tg?.initDataUnsafe?.user || {};
const userId = user.id || "guest";
const userName = user.username || user.first_name || "Гость";

document.getElementById("user-name").textContent = `Привет, ${userName}!`;

let galleons = 0;
let autoClickers = 0;
let bonusActive = false;
let totalCrits = 0;

const galleonsDisplay = document.getElementById("galleons");
const critEffect = document.getElementById("crit-effect");
const achievementList = document.getElementById("achievement-list");
const leaderList = document.getElementById("leader-list");

function updateGalleons() {
  galleonsDisplay.textContent = `${galleons} 💰`;
}

function showCritEffect(multiplier) {
  critEffect.textContent = `x${multiplier}!`;
  critEffect.style.opacity = "1";
  setTimeout(() => (critEffect.style.opacity = "0"), 500);
}

function loadProgress() {
  const saved = localStorage.getItem(`hogwartsClicker_${userId}`);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      galleons = data.galleons || 0;
      autoClickers = data.autoClickers || 0;
      totalCrits = data.totalCrits || 0;
    } catch {}
  }
  updateGalleons();
  checkAchievements();
}
loadProgress();

function saveProgress() {
  const data = { galleons, autoClickers, totalCrits };
  localStorage.setItem(`hogwartsClicker_${userId}`, JSON.stringify(data));
  updateLeaderboardLocal();
}

function clickWand() {
  let multiplier = 1;
  if (bonusActive) {
    multiplier = 5;
  } else if (Math.random() < 0.1) {
    multiplier = Math.floor(Math.random() * 4) + 2;
    totalCrits++;
    showCritEffect(multiplier);
  }

  galleons += multiplier;
  updateGalleons();
  saveProgress();
  checkAchievements();
}

setInterval(() => {
  if (autoClickers > 0) {
    galleons += autoClickers;
    updateGalleons();
    saveProgress();
    checkAchievements();
  }
}, 1000);

document.getElementById("buy-lumos").onclick = () => {
  if (galleons >= 100) {
    galleons -= 100;
    autoClickers++;
    updateGalleons();
    saveProgress();
    alert("Люмос куплен! +1 автоклик в секунду.");
  } else {
    alert("Недостаточно галлеонов.");
  }
};

document.getElementById("activate-accio").onclick = () => {
  if (galleons >= 300) {
    if (bonusActive) {
      alert("Бонус Акцио уже активен!");
      return;
    }
    galleons -= 300;
    bonusActive = true;
    updateGalleons();
    alert("Акцио активирован! 10 секунд x5 кликов!");
    saveProgress();
    setTimeout(() => {
      bonusActive = false;
      alert("Бонус Акцио закончился.");
    }, 10000);
  } else {
    alert("Недостаточно галлеонов.");
  }
};

const achievements = [
  { id: "g1000", text: "💰 Накопи 1000 галлеонов", condition: () => galleons >= 1000 },
  { id: "l3", text: "🪄 Купи 3 Люмоса", condition: () => autoClickers >= 3 },
  { id: "crit5", text: "⚡️ Сделай 5 критических кликов", condition: () => totalCrits >= 5 }
];
let unlockedAchievements = [];

function checkAchievements() {
  achievements.forEach((ach) => {
    if (!unlockedAchievements.includes(ach.id) && ach.condition()) {
      unlockedAchievements.push(ach.id);
      alert("Достижение разблокировано: " + ach.text);
      renderAchievements();
    }
  });
}

function renderAchievements() {
  achievementList.innerHTML = "";
  unlockedAchievements.forEach((id) => {
    const ach = achievements.find(a => a.id === id);
    if (ach) {
      const li = document.createElement("li");
      li.textContent = ach.text;
      achievementList.appendChild(li);
    }
  });
}
renderAchievements();

function updateLeaderboardLocal() {
  // Сохраняем локально рейтинг по пользователям в localStorage
  const leaderboardRaw = localStorage.getItem("hogwartsLeaderBoard");
  let leaderboard = leaderboardRaw ? JSON.parse(leaderboardRaw) : {};
  leaderboard[userName] = galleons;
  localStorage.setItem("hogwartsLeaderBoard", JSON.stringify(leaderboard));
}

function showLeaderboard() {
  const leaderboardRaw = localStorage.getItem("hogwartsLeaderBoard");
  if (!leaderboardRaw) {
    leaderList.innerHTML = "<li>Рейтинг пуст</li>";
    return;
  }
  const leaderboard = JSON.parse(leaderboardRaw);

  // Сортируем по убыванию очков
  const sorted = Object.entries(leaderboard).sort((a, b) => b[1] - a[1]);

  leaderList.innerHTML = "";
  sorted.forEach(([name, score], i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${name} — ${score} 💰`;
    leaderList.appendChild(li);
  });
}

document.getElementById("btn-load-leaderboard").onclick = showLeaderboard;

document.getElementById("btn-close").onclick = () => {
  tg?.close();
};

document.getElementById("click-wand").onclick = clickWand;
