// === Инициализация Telegram ===
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
    document.getElementById('user-name').textContent = tg.initDataUnsafe?.user?.first_name || 'Игрок';
}

// === Состояние игры ===
let state = {
    balance: 150000,
    selectedCarId: null,
    cars: [
        { id: 1, name: 'Renault Duster', year: 2011, color: 'Белый', icon: '🚙', plate: null, tuned: { engine: false, suspension: false, body: false } },
        { id: 2, name: 'Lada Vesta', year: 2020, color: 'Синий', icon: '🚗', plate: null, tuned: { engine: false, suspension: false, body: false } },
        { id: 3, name: 'Toyota Camry', year: 2022, color: 'Черный', icon: '🚘', plate: null, tuned: { engine: false, suspension: false, body: false } }
    ],
    savedPlates: []
};

// Загрузка из localStorage
function loadState() {
    const saved = localStorage.getItem('carGameState');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed.balance === 'number') {
                state = parsed;
            }
        } catch (e) { console.warn('Ошибка загрузки', e); }
    }
    updateUI();
}

function saveState() {
    localStorage.setItem('carGameState', JSON.stringify(state));
}

// === UI Обновление ===
function updateUI() {
    document.getElementById('balance-amount').textContent = state.balance.toLocaleString('ru-RU');

    const carList = document.getElementById('car-list');
    carList.innerHTML = state.cars.map(car => `
        <div class="car-card ${state.selectedCarId === car.id ? 'selected' : ''}" data-id="${car.id}">
            <div class="car-image">${car.icon}</div>
            <div class="car-name">${car.name}</div>
            <div class="car-class">${car.year} • ${car.color}</div>
            ${car.plate ? `<div class="car-plate">${car.plate}</div>` : ''}
        </div>
    `).join('');

    document.querySelectorAll('.car-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = parseInt(card.dataset.id);
            state.selectedCarId = id;
            updateUI();
            updateTuningInfo();
            if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
        });
    });

    const savedList = document.getElementById('saved-plates');
    if (state.savedPlates.length > 0) {
        savedList.innerHTML = state.savedPlates.map(p => `<div class="saved-plate">${p}</div>`).join('');
    } else {
        savedList.innerHTML = '';
    }

    saveState();
}

function updateTuningInfo() {
    const car = state.cars.find(c => c.id === state.selectedCarId);
    const info = document.getElementById('selected-car-info');
    if (car) {
        info.textContent = `${car.name} (${car.year}) — выбран`;
        info.style.color = '#6c5ce7';
    } else {
        info.textContent = 'Выберите машину в гараже';
        info.style.color = '#888';
    }
}

// === Генерация номеров ===
function generatePlate(format) {
    const cost = 5000;
    if (state.balance < cost) {
        alert('Недостаточно средств!');
        return;
    }

    let plate = '';
    const letters = 'АВЕКМНОРСТУХ';

    if (format === 'ru') {
        const l1 = letters[Math.floor(Math.random() * letters.length)];
        const d = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
        const l2 = letters[Math.floor(Math.random() * letters.length)];
        const l3 = letters[Math.floor(Math.random() * letters.length)];
        const region = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');
        plate = `${l1}${d}${l2}${l3} ${region}`;
    } else if (format === 'kz') {
        const d = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
        const l1 = letters[Math.floor(Math.random() * letters.length)];
        const l2 = letters[Math.floor(Math.random() * letters.length)];
        const l3 = letters[Math.floor(Math.random() * letters.length)];
        const region = String(Math.floor(Math.random() * 20) + 1).padStart(2, '0');
        plate = `${d} ${l1}${l2}${l3} ${region}`;
    } else if (format === 'by') {
        const d = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        const l1 = letters[Math.floor(Math.random() * letters.length)];
        const l2 = letters[Math.floor(Math.random() * letters.length)];
        const region = Math.floor(Math.random() * 7) + 1;
        plate = `${d} ${l1}${l2}-${region}`;
    }

    state.balance -= cost;
    state.savedPlates.unshift(plate);
    if (state.savedPlates.length > 10) state.savedPlates.pop();

    const car = state.cars.find(c => c.id === state.selectedCarId);
    if (car) car.plate = plate;

    document.getElementById('plate-result').textContent = plate;
    updateUI();

    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

// === Тюнинг ===
function applyTuning(type, cost) {
    if (!state.selectedCarId) {
        alert('Сначала выберите машину в гараже!');
        return;
    }
    const car = state.cars.find(c => c.id === state.selectedCarId);
    if (!car) return;

    if (car.tuned[type]) {
        alert('Этот тюнинг уже установлен!');
        return;
    }

    if (state.balance < cost) {
        alert('Недостаточно средств!');
        return;
    }

    state.balance -= cost;
    car.tuned[type] = true;
    updateUI();
    alert(`Тюнинг "${type}" установлен на ${car.name}!`);

    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

// === Навигация ===
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(btn.dataset.target).classList.add('active');
    });
});

// === Обработчики кнопок ===
document.getElementById('gen-ru').addEventListener('click', () => generatePlate('ru'));
document.getElementById('gen-kz').addEventListener('click', () => generatePlate('kz'));
document.getElementById('gen-by').addEventListener('click', () => generatePlate('by'));

document.querySelectorAll('.tune-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const cost = parseInt(btn.dataset.cost);
        applyTuning(type, cost);
    });
});

// === Старт ===
loadState();
updateTuningInfo();