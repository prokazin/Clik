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
  
  // Создаем эффект заклинания
  const spellEffect = document.createElement('div');
  spellEffect.className = `spell-effect ${key}`;
  document.body.appendChild(spellEffect);
  
  // Завершаем эффект через duration
  if (spell.duration) {
    setTimeout(() => {
      spell.active = false;
      
      // Сбрасываем множители
      if (key === 'lumos') gameState.spellMultiplier = 1;
      if (key === 'wingardium') gameState.autoClickBoost = 1;
      
      spellEffect.remove();
    }, spell.duration * 1000);
  } else {
    spell.active = false;
    setTimeout(() => spellEffect.remove(), 1000);
  }
  
  updateDisplay();
  renderSpells();
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
          <h3>${skill.name} (${skill.level}/${skill.maxLevel})</h3>
          <p>${skill.description}</p>
          <p>Текущий эффект: ${getSkillEffectDescription(key)}</p>
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
    <table>
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
  document.querySelectorAll('.faculty-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      selectFaculty(e.target.dataset.faculty);
    });
  });
  
  // Автосохранение каждые 30 секунд
  setInterval(saveProgress, 30000);
  
  // Обработка закрытия страницы
  window.addEventListener('beforeunload', saveProgress);
}

// Инициализация при загрузке
window.addEventListener('DOMContentLoaded', initGame);
