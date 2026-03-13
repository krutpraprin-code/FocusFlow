'use strict';

class App {
    constructor() {
        this.tasks = [];
        this.settings = {
            darkMode: false,
            sound: true,
            vibration: true
        };
        this.stats = {
            points: 0,
            streak: 0,
            lastStreakDate: null
        };
        this.rewards = [
            { id: 1, name: 'Первые шаги', desc: 'Выполнить 5 задач', icon: '🌱', unlocked: false },
            { id: 2, name: 'В ритме', desc: '7 дней подряд', icon: '🔥', unlocked: false },
            { id: 3, name: 'Мастер', desc: '50 выполненных задач', icon: '⭐', unlocked: false },
            { id: 4, name: 'Фокус', desc: '10 часов фокуса', icon: '🎯', unlocked: false }
        ];
        
        this.timerInterval = null;
        this.timerSeconds = 25 * 60;
        this.timerRunning = false;
        this.chart = null;
        
        this.init();
    }

    init() {
        this.loadData();
        this.initElements();
        this.initEventListeners();
        this.renderTasks();
        this.updateStats();
        this.renderRewards();
        this.updateGreeting();
        this.updateTheme();
    }

    initElements() {
        // Шапка
        this.menuBtn = document.getElementById('menuBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.headerTitle = document.getElementById('headerTitle');
        
        // Меню
        this.sideMenu = document.getElementById('sideMenu');
        this.menuBackdrop = document.getElementById('menuBackdrop');
        this.closeMenu = document.getElementById('closeMenu');
        this.menuItems = document.querySelectorAll('.menu-item');
        this.menuStreak = document.getElementById('menuStreak');
        
        // Вкладки
        this.tabs = {
            today: document.getElementById('todayTab'),
            focus: document.getElementById('focusTab'),
            stats: document.getElementById('statsTab'),
            rewards: document.getElementById('rewardsTab')
        };
        
        // Задачи
        this.taskInput = document.getElementById('taskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.tasksCount = document.getElementById('tasksCount');
        
        // Приветствие
        this.greetingEmoji = document.getElementById('greetingEmoji');
        this.greetingText = document.getElementById('greetingText');
        
        // Таймер
        this.timerDisplay = document.getElementById('timerDisplay');
        this.timerProgress = document.getElementById('timerProgress');
        this.startTimer = document.getElementById('startTimer');
        this.resetTimer = document.getElementById('resetTimer');
        this.focusQuote = document.getElementById('focusQuote');
        
        // Статистика
        this.statToday = document.getElementById('statToday');
        this.statPoints = document.getElementById('statPoints');
        this.statStreak = document.getElementById('statStreak');
        this.statLevel = document.getElementById('statLevel');
        this.chartCanvas = document.getElementById('statsChart');
        
        // Награды
        this.rewardsGrid = document.getElementById('rewardsGrid');
        
        // Модалка задачи
        this.taskModal = document.getElementById('taskModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.taskTextInput = document.getElementById('taskTextInput');
        this.taskDescInput = document.getElementById('taskDescInput');
        this.taskCategorySelect = document.getElementById('taskCategorySelect');
        this.taskPrioritySelect = document.getElementById('taskPrioritySelect');
        this.taskForm = document.getElementById('taskForm');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        
        // Модалка настроек
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettingsBtn = document.getElementById('closeSettingsBtn');
        this.themeCheckbox = document.getElementById('themeCheckbox');
        this.soundCheckbox = document.getElementById('soundCheckbox');
        this.vibrationCheckbox = document.getElementById('vibrationCheckbox');
        
        // Тосты
        this.toastContainer = document.getElementById('toastContainer');
        
        // Текущее состояние
        this.currentTaskId = null;
    }

    initEventListeners() {
        // Меню
        this.menuBtn.addEventListener('click', () => this.toggleMenu());
        this.menuBackdrop.addEventListener('click', () => this.toggleMenu());
        this.closeMenu.addEventListener('click', () => this.toggleMenu());
        
        this.menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = item.dataset.tab;
                this.switchTab(tab);
                this.toggleMenu();
            });
        });
        
        // Настройки
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        
        this.themeCheckbox.addEventListener('change', () => {
            this.settings.darkMode = this.themeCheckbox.checked;
            this.updateTheme();
            this.saveData();
        });
        
        this.soundCheckbox.addEventListener('change', () => {
            this.settings.sound = this.soundCheckbox.checked;
            this.saveData();
        });
        
        this.vibrationCheckbox.addEventListener('change', () => {
            this.settings.vibration = this.vibrationCheckbox.checked;
            this.saveData();
        });
        
        // Задачи
        this.addTaskBtn.addEventListener('click', () => this.openTaskModal());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.quickAddTask();
        });
        
        // Форма задачи
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });
        
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        
        // Таймер
        this.startTimer.addEventListener('click', () => this.toggleTimer());
        this.resetTimer.addEventListener('click', () => this.resetTimerToDefault());
        
        // Закрытие модалок по клику на фон
        this.taskModal.addEventListener('click', (e) => {
            if (e.target === this.taskModal) this.closeModal();
        });
        
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) this.closeSettings();
        });
    }

    // ===== УПРАВЛЕНИЕ МЕНЮ =====
    toggleMenu() {
        this.sideMenu.classList.toggle('open');
    }

    switchTab(tab) {
        // Обновляем заголовок
        const titles = {
            today: 'Сегодня',
            focus: 'Фокус',
            stats: 'Статистика',
            rewards: 'Награды'
        };
        this.headerTitle.textContent = titles[tab] || 'Сегодня';
        
        // Скрываем все вкладки
        Object.values(this.tabs).forEach(t => t.classList.remove('active'));
        
        // Показываем нужную
        if (this.tabs[tab]) {
            this.tabs[tab].classList.add('active');
        }
        
        // Обновляем активный пункт меню
        this.menuItems.forEach(item => {
            if (item.dataset.tab === tab) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Специфичные действия
        if (tab === 'stats') {
            setTimeout(() => this.initChart(), 100);
        }
    }

    // ===== ЗАДАЧИ =====
    quickAddTask() {
        const text = this.taskInput.value.trim();
        if (!text) return;
        
        this.addTask(text);
        this.taskInput.value = '';
        this.showToast('✅ Задача добавлена');
    }

    openTaskModal(task = null) {
        this.currentTaskId = task ? task.id : null;
        this.modalTitle.textContent = task ? 'Редактировать' : 'Новая задача';
        
        if (task) {
            this.taskTextInput.value = task.text || '';
            this.taskDescInput.value = task.description || '';
            this.taskCategorySelect.value = task.category || 'personal';
            this.taskPrioritySelect.value = task.priority || 'medium';
        } else {
            this.taskForm.reset();
        }
        
        this.taskModal.classList.add('open');
    }

    closeModal() {
        this.taskModal.classList.remove('open');
        this.currentTaskId = null;
    }

    saveTask() {
        const text = this.taskTextInput.value.trim();
        if (!text) return;
        
        const taskData = {
            id: this.currentTaskId || Date.now(),
            text: text,
            description: this.taskDescInput.value,
            category: this.taskCategorySelect.value,
            priority: this.taskPrioritySelect.value,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        if (this.currentTaskId) {
            const index = this.tasks.findIndex(t => t.id === this.currentTaskId);
            if (index !== -1) {
                this.tasks[index] = { ...this.tasks[index], ...taskData };
                this.showToast('✏️ Задача обновлена');
            }
        } else {
            this.tasks.push(taskData);
            this.showToast('✨ Задача создана');
        }
        
        this.playSound('save');
        this.vibrate(20);
        this.saveData();
        this.renderTasks();
        this.closeModal();
    }

    addTask(text) {
        const task = {
            id: Date.now(),
            text: text,
            description: '',
            category: 'personal',
            priority: 'medium',
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.tasks.push(task);
        this.saveData();
        this.renderTasks();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;
        
        task.completed = !task.completed;
        
        if (task.completed) {
            this.stats.points += task.priority === 'high' ? 20 : task.priority === 'medium' ? 10 : 5;
            this.updateStreak();
            this.checkRewards();
            this.playSound('complete');
            this.vibrate(30);
            this.showToast(`⭐ +${task.priority === 'high' ? 20 : task.priority === 'medium' ? 10 : 5} очков`);
        }
        
        this.saveData();
        this.renderTasks();
        this.updateStats();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveData();
        this.renderTasks();
        this.playSound('delete');
        this.vibrate(20);
        this.showToast('🗑️ Задача удалена');
    }

    renderTasks() {
        if (!this.taskList) return;
        
        this.taskList.innerHTML = '';
        
        const incompleteTasks = this.tasks.filter(t => !t.completed);
        const completedTasks = this.tasks.filter(t => t.completed);
        const sortedTasks = [...incompleteTasks, ...completedTasks];
        
        if (sortedTasks.length === 0) {
            this.emptyState.style.display = 'block';
            this.tasksCount.textContent = '0';
            return;
        }
        
        this.emptyState.style.display = 'none';
        this.tasksCount.textContent = sortedTasks.length;
        
        sortedTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.dataset.id = task.id;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => this.toggleTask(task.id));
            
            const content = document.createElement('div');
            content.className = 'task-content';
            
            const text = document.createElement('div');
            text.className = 'task-text';
            text.textContent = task.text;
            
            const meta = document.createElement('div');
            meta.className = 'task-meta';
            
            const categoryIcons = {
                work: '💼',
                personal: '🏠',
                health: '💪'
            };
            meta.innerHTML = `
                <span>${categoryIcons[task.category] || '📋'}</span>
                <span>•</span>
                <span>${task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}</span>
            `;
            
            content.appendChild(text);
            content.appendChild(meta);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '✕';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteTask(task.id);
            });
            
            li.appendChild(checkbox);
            li.appendChild(content);
            li.appendChild(deleteBtn);
            
            li.addEventListener('click', (e) => {
                if (e.target === checkbox || e.target === deleteBtn) return;
                this.openTaskModal(task);
            });
            
            this.taskList.appendChild(li);
        });
    }

    // ===== СТАТИСТИКА =====
    updateStats() {
        const today = new Date().toISOString().split('T')[0];
        const completedToday = this.tasks.filter(t => t.completed && t.createdAt.startsWith(today)).length;
        
        this.statToday.textContent = completedToday;
        this.statPoints.textContent = this.stats.points;
        this.statStreak.textContent = this.stats.streak;
        this.statLevel.textContent = Math.floor(this.stats.points / 100) + 1;
        this.menuStreak.textContent = this.stats.streak;
    }

    updateStreak() {
        const today = new Date().toDateString();
        
        if (this.stats.lastStreakDate !== today) {
            const completedToday = this.tasks.some(t => 
                t.completed && t.createdAt.startsWith(new Date().toISOString().split('T')[0])
            );
            
            if (completedToday) {
                const yesterday = new Date(Date.now() - 86400000).toDateString();
                
                if (this.stats.lastStreakDate === yesterday) {
                    this.stats.streak++;
                    this.showToast(`🔥 Уже ${this.stats.streak} дней подряд!`);
                } else if (!this.stats.lastStreakDate) {
                    this.stats.streak = 1;
                }
                
                this.stats.lastStreakDate = today;
            }
        }
    }

    initChart() {
        if (!this.chartCanvas) return;
        
        const ctx = this.chartCanvas.getContext('2d');
        
        const labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const count = this.tasks.filter(t => 
                t.completed && t.createdAt.startsWith(dateStr)
            ).length;
            
            data.push(count);
        }
        
        if (this.chart) {
            this.chart.destroy();
        }
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Выполнено задач',
                    data: data,
                    borderColor: '#6C8CFF',
                    backgroundColor: '#6C8CFF20',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#E5E9F0' } }
                }
            }
        });
    }

    // ===== НАГРАДЫ =====
    renderRewards() {
        if (!this.rewardsGrid) return;
        
        this.rewardsGrid.innerHTML = '';
        
        this.rewards.forEach(reward => {
            const card = document.createElement('div');
            card.className = `reward-card ${reward.unlocked ? 'unlocked' : 'locked'}`;
            card.innerHTML = `
                <div class="reward-icon">${reward.icon}</div>
                <div class="reward-name">${reward.name}</div>
                <div class="reward-desc">${reward.desc}</div>
            `;
            this.rewardsGrid.appendChild(card);
        });
    }

    checkRewards() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        
        // Первая награда
        if (completedCount >= 5 && !this.rewards[0].unlocked) {
            this.unlockReward(0);
        }
        
        // Вторая награда
        if (this.stats.streak >= 7 && !this.rewards[1].unlocked) {
            this.unlockReward(1);
        }
        
        // Третья награда
        if (completedCount >= 50 && !this.rewards[2].unlocked) {
            this.unlockReward(2);
        }
    }

    unlockReward(index) {
        if (index >= 0 && index < this.rewards.length) {
            this.rewards[index].unlocked = true;
            this.renderRewards();
            this.showToast(`🏆 Получено: ${this.rewards[index].name}`);
            this.playSound('achievement');
            this.vibrate(50);
            this.saveData();
        }
    }

    // ===== ТАЙМЕР =====
    toggleTimer() {
        if (this.timerRunning) {
            this.stopTimer();
        } else {
            this.startTimerFunc();
        }
    }

    startTimerFunc() {
        this.timerRunning = true;
        this.startTimer.textContent = 'Пауза';
        this.startTimer.classList.add('active');
        
        this.timerInterval = setInterval(() => {
            if (this.timerSeconds > 0) {
                this.timerSeconds--;
                this.updateTimerDisplay();
            } else {
                this.stopTimer();
                this.playSound('complete');
                this.vibrate(100);
                this.showToast('🎉 Время вышло! Отдохни');
            }
        }, 1000);
    }

    stopTimer() {
        this.timerRunning = false;
        this.startTimer.textContent = 'Начать';
        this.startTimer.classList.remove('active');
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    resetTimerToDefault() {
        this.stopTimer();
        this.timerSeconds = 25 * 60;
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timerSeconds / 60);
        const seconds = this.timerSeconds % 60;
        this.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const progress = (this.timerSeconds / (25 * 60)) * 628.3;
        if (this.timerProgress) {
            this.timerProgress.setAttribute('stroke-dashoffset', progress);
        }
    }

    // ===== ПРИВЕТСТВИЕ =====
    updateGreeting() {
        const hour = new Date().getHours();
        let greeting = '';
        let emoji = '';
        
        if (hour < 12) {
            greeting = 'Доброе утро';
            emoji = '🌅';
        } else if (hour < 18) {
            greeting = 'Добрый день';
            emoji = '☀️';
        } else {
            greeting = 'Добрый вечер';
            emoji = '🌙';
        }
        
        this.greetingText.textContent = greeting;
        this.greetingEmoji.textContent = emoji;
        
        const quotes = [
            '✨ Маленькие шаги — большой прогресс',
            '🎯 Одна задача за раз',
            '💪 Ты справишься!',
            '🌟 Каждый день важен'
        ];
        
        this.focusQuote.textContent = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
    }

    // ===== НАСТРОЙКИ =====
    openSettings() {
        this.themeCheckbox.checked = this.settings.darkMode;
        this.soundCheckbox.checked = this.settings.sound;
        this.vibrationCheckbox.checked = this.settings.vibration;
        this.settingsModal.classList.add('open');
    }

    closeSettings() {
        this.settingsModal.classList.remove('open');
    }

    updateTheme() {
        if (this.settings.darkMode) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }

    // ===== ТОСТЫ =====
    showToast(message, duration = 3000) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span>${message}</span>`;
        
        this.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ===== ЗВУКИ =====
    playSound(type) {
        if (!this.settings.sound) return;
        
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            const frequencies = {
                save: 440,
                complete: 523,
                delete: 220,
                achievement: 880
            };
            
            oscillator.frequency.value = frequencies[type] || 440;
            gainNode.gain.value = 0.1;
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
        } catch (e) {
            console.log('Sound not supported');
        }
    }

    // ===== ВИБРАЦИЯ =====
    vibrate(duration) {
        if (this.settings.vibration && navigator.vibrate) {
            navigator.vibrate(duration);
        }
    }

    // ===== ХРАНЕНИЕ ДАННЫХ =====
    saveData() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        localStorage.setItem('settings', JSON.stringify(this.settings));
        localStorage.setItem('stats', JSON.stringify(this.stats));
        localStorage.setItem('rewards', JSON.stringify(this.rewards));
    }

    loadData() {
        try {
            this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            this.settings = { ...this.settings, ...JSON.parse(localStorage.getItem('settings')) };
            this.stats = { ...this.stats, ...JSON.parse(localStorage.getItem('stats')) };
            this.rewards = JSON.parse(localStorage.getItem('rewards')) || this.rewards;
        } catch (e) {
            console.error('Error loading data:', e);
        }
    }
}

// ЗАПУСК
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});