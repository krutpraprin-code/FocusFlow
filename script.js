'use strict';

class TaskManager {
    constructor() {
        // Данные
        this.tasks = [];
        this.categories = [
            { id: 'work', name: 'Работа', color: '#6C8CFF', icon: '💼' },
            { id: 'personal', name: 'Личное', color: '#FF9F6C', icon: '🏠' },
            { id: 'health', name: 'Здоровье', color: '#6CD4B4', icon: '💪' },
            { id: 'study', name: 'Учёба', color: '#FF6C8C', icon: '📚' },
            { id: 'finance', name: 'Финансы', color: '#F5A524', icon: '💰' }
        ];
        
        this.settings = {
            theme: 'auto',
            accentColor: '#6C8CFF',
            fontSize: 'medium',
            sort: 'manual',
            sound: true,
            vibration: true,
            notifications: false
        };
        
        this.stats = {
            points: 0,
            level: 1,
            streak: 0,
            lastStreakDate: null,
            achievements: []
        };
        
        this.archive = [];
        this.achievementsList = [
            { id: 'first_task', name: 'Первый шаг', desc: 'Выполнить первую задачу', icon: '🌟', unlocked: false },
            { id: 'five_tasks', name: 'Пятёрочка', desc: 'Выполнить 5 задач за день', icon: '⭐', unlocked: false },
            { id: 'ten_tasks', name: 'Десятка', desc: 'Выполнить 10 задач за день', icon: '💫', unlocked: false },
            { id: 'week_streak', name: 'Неделя', desc: '7 дней подряд с задачами', icon: '🔥', unlocked: false },
            { id: 'month_streak', name: 'Месяц', desc: '30 дней подряд', icon: '⚡', unlocked: false },
            { id: 'high_priority', name: 'Важное', desc: 'Выполнить 10 важных задач', icon: '🔴', unlocked: false },
            { id: 'category_master', name: 'Мастер категорий', desc: 'Задачи во всех категориях', icon: '🎯', unlocked: false },
            { id: 'points_100', name: '100 очков', desc: 'Накопить 100 очков', icon: '💯', unlocked: false },
            { id: 'points_500', name: '500 очков', desc: 'Накопить 500 очков', icon: '🏆', unlocked: false },
            { id: 'archive_10', name: 'Архивариус', desc: 'Отправить 10 задач в архив', icon: '📦', unlocked: false }
        ];

        // Состояние
        this.currentTab = 'tasks';
        this.editingTaskId = null;
        this.sortableInstance = null;
        this.weeklyChart = null;
        this.swipeHandlers = new Map();

        // Инициализация
        this.initElements();
        this.loadData();
        this.initEventListeners();
        this.applySettings();
        this.checkStreak();
        this.render();
        this.requestNotificationPermission();
    }

    // ===== ИНИЦИАЛИЗАЦИЯ ЭЛЕМЕНТОВ =====
    initElements() {
        console.log('initElements started');
        
        // Основные
        this.headerTitle = document.getElementById('headerTitle');
        this.menuBtn = document.getElementById('menuBtn');
        this.sideMenu = document.getElementById('sideMenu');
        this.closeMenu = document.getElementById('closeMenu');
        this.menuItems = document.querySelectorAll('.menu-items li');
        
        // Вкладки
        this.tasksTab = document.getElementById('tasksTab');
        this.statsTab = document.getElementById('statsTab');
        this.archiveTab = document.getElementById('archiveTab');
        this.achievementsTab = document.getElementById('achievementsTab');
        
        // Задачи
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.quickInput = document.getElementById('quickTaskInput');
        this.quickAddBtn = document.getElementById('quickAddBtn');
        
        // Статистика
        this.streakDisplay = document.getElementById('streakDisplay');
        this.pointsDisplay = document.getElementById('pointsDisplay');
        this.levelDisplay = document.getElementById('levelDisplay');
        this.statToday = document.getElementById('statToday');
        this.statPoints = document.getElementById('statPoints');
        this.statStreak = document.getElementById('statStreak');
        this.statLevel = document.getElementById('statLevel');
        this.menuStreak = document.getElementById('menuStreak');
        
        // Модалки - ВАЖНО: проверяем существование
        this.taskModal = document.getElementById('taskModal');
        this.settingsModal = document.getElementById('settingsModal');
        
        console.log('taskModal found:', !!this.taskModal);
        console.log('settingsModal found:', !!this.settingsModal);
        
        if (!this.taskModal) console.error('taskModal not found in DOM');
        if (!this.settingsModal) console.error('settingsModal not found in DOM');
        
        this.modalTitle = document.getElementById('modalTitle');
        this.taskForm = document.getElementById('taskForm');
        this.taskText = document.getElementById('taskText');
        this.taskDescription = document.getElementById('taskDescription');
        this.taskCategory = document.getElementById('taskCategory');
        this.taskPriority = document.getElementById('taskPriority');
        this.taskDate = document.getElementById('taskDate');
        this.taskRepeat = document.getElementById('taskRepeat');
        this.subtasksContainer = document.getElementById('subtasksContainer');
        this.addSubtaskBtn = document.getElementById('addSubtaskBtn');
        this.closeModalBtn = document.getElementById('closeModal');
        this.openAddModalBtn = document.getElementById('openAddModal');
        
        // Настройки
        this.openSettingsBtn = document.getElementById('openSettings');
        this.closeSettingsBtn = document.getElementById('closeSettings');
        this.themeSelect = document.getElementById('themeSelect');
        this.accentColorPicker = document.getElementById('accentColorPicker');
        this.fontSizeSelect = document.getElementById('fontSizeSelect');
        this.sortSelect = document.getElementById('sortSelect');
        this.soundCheckbox = document.getElementById('soundCheckbox');
        this.vibrationCheckbox = document.getElementById('vibrationCheckbox');
        this.notificationsCheckbox = document.getElementById('notificationsCheckbox');
        
        // Архив
        this.archiveList = document.getElementById('archiveList');
        this.clearArchiveBtn = document.getElementById('clearArchive');
        
        // Достижения
        this.achievementsGrid = document.getElementById('achievementsGrid');
        this.achievementToast = document.getElementById('achievementToast');
        this.toastMessage = document.getElementById('toastMessage');
        
        // AI
        this.aiFab = document.getElementById('aiFab');
        
        console.log('initElements completed');
    }

    // ===== ЗАГРУЗКА ДАННЫХ =====
    loadData() {
        try {
            this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            this.categories = JSON.parse(localStorage.getItem('categories')) || this.categories;
            this.settings = { ...this.settings, ...JSON.parse(localStorage.getItem('settings')) };
            this.stats = { ...this.stats, ...JSON.parse(localStorage.getItem('stats')) };
            this.archive = JSON.parse(localStorage.getItem('archive')) || [];
            this.achievementsList = JSON.parse(localStorage.getItem('achievements')) || this.achievementsList;
        } catch (e) {
            console.error('Ошибка загрузки:', e);
        }
    }

    // ===== СОХРАНЕНИЕ =====
    saveAll() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        localStorage.setItem('categories', JSON.stringify(this.categories));
        localStorage.setItem('settings', JSON.stringify(this.settings));
        localStorage.setItem('stats', JSON.stringify(this.stats));
        localStorage.setItem('archive', JSON.stringify(this.archive));
        localStorage.setItem('achievements', JSON.stringify(this.achievementsList));
    }

    // ===== ПРИМЕНЕНИЕ НАСТРОЕК =====
    applySettings() {
        // Тема
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (this.settings.theme === 'dark' || (this.settings.theme === 'auto' && prefersDark)) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }

        // Акцентный цвет
        document.documentElement.style.setProperty('--accent', this.settings.accentColor);
        
        // Полупрозрачный вариант для фона
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '108, 140, 255';
        };
        document.documentElement.style.setProperty('--accent-rgb', hexToRgb(this.settings.accentColor));

        // Размер шрифта
        document.body.classList.remove('font-small', 'font-medium', 'font-large');
        document.body.classList.add(`font-${this.settings.fontSize}`);

        // Чекбоксы в настройках (если элементы существуют)
        if (this.themeSelect) this.themeSelect.value = this.settings.theme;
        if (this.accentColorPicker) this.accentColorPicker.value = this.settings.accentColor;
        if (this.fontSizeSelect) this.fontSizeSelect.value = this.settings.fontSize;
        if (this.sortSelect) this.sortSelect.value = this.settings.sort;
        if (this.soundCheckbox) this.soundCheckbox.checked = this.settings.sound;
        if (this.vibrationCheckbox) this.vibrationCheckbox.checked = this.settings.vibration;
        if (this.notificationsCheckbox) this.notificationsCheckbox.checked = this.settings.notifications;
    }

    // ===== ОБРАБОТЧИКИ =====
    initEventListeners() {
        console.log('initEventListeners started');
        
        // Меню
        if (this.menuBtn) {
            this.menuBtn.addEventListener('click', () => this.toggleMenu());
        }
        if (this.closeMenu) {
            this.closeMenu.addEventListener('click', () => this.toggleMenu());
        }
        
        if (this.menuItems) {
            this.menuItems.forEach(item => {
                item.addEventListener('click', () => {
                    const tab = item.dataset.tab;
                    this.switchTab(tab);
                    this.toggleMenu();
                });
            });
        }

        // Закрытие меню при клике вне
        document.addEventListener('click', (e) => {
            if (this.sideMenu && !this.sideMenu.classList.contains('hidden') && 
                !this.sideMenu.contains(e.target) && 
                e.target !== this.menuBtn) {
                this.toggleMenu();
            }
        });

        // Навигация по вкладкам
        document.querySelectorAll('[data-tab]').forEach(el => {
            el.addEventListener('click', () => this.switchTab(el.dataset.tab));
        });

        // Быстрое добавление
        if (this.quickAddBtn) {
            this.quickAddBtn.addEventListener('click', () => this.quickAddTask());
        }
        if (this.quickInput) {
            this.quickInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.quickAddTask();
            });
        }

        // Открытие модалки задачи
        if (this.openAddModalBtn) {
            this.openAddModalBtn.addEventListener('click', () => this.openTaskModal());
        }

        // Закрытие модалок
        if (this.closeModalBtn && this.taskModal) {
            this.closeModalBtn.addEventListener('click', () => this.closeModal(this.taskModal));
        }
        if (this.closeSettingsBtn && this.settingsModal) {
            this.closeSettingsBtn.addEventListener('click', () => this.closeModal(this.settingsModal));
        }

        // Форма задачи
        if (this.taskForm) {
            this.taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTask();
            });
        }

        // Подзадачи
        if (this.addSubtaskBtn) {
            this.addSubtaskBtn.addEventListener('click', () => this.addSubtaskField());
        }

        // Настройки
        if (this.themeSelect) {
            this.themeSelect.addEventListener('change', () => {
                this.settings.theme = this.themeSelect.value;
                this.applySettings();
                this.saveAll();
            });
        }

        if (this.accentColorPicker) {
            this.accentColorPicker.addEventListener('input', (e) => {
                this.settings.accentColor = e.target.value;
                this.applySettings();
                this.saveAll();
            });
        }

        if (this.fontSizeSelect) {
            this.fontSizeSelect.addEventListener('change', () => {
                this.settings.fontSize = this.fontSizeSelect.value;
                this.applySettings();
                this.saveAll();
            });
        }

        if (this.sortSelect) {
            this.sortSelect.addEventListener('change', () => {
                this.settings.sort = this.sortSelect.value;
                this.saveAll();
                this.render();
            });
        }

        if (this.soundCheckbox) {
            this.soundCheckbox.addEventListener('change', () => {
                this.settings.sound = this.soundCheckbox.checked;
                this.saveAll();
            });
        }

        if (this.vibrationCheckbox) {
            this.vibrationCheckbox.addEventListener('change', () => {
                this.settings.vibration = this.vibrationCheckbox.checked;
                this.saveAll();
            });
        }

        if (this.notificationsCheckbox) {
            this.notificationsCheckbox.addEventListener('change', () => {
                this.settings.notifications = this.notificationsCheckbox.checked;
                if (this.settings.notifications) {
                    this.requestNotificationPermission();
                }
                this.saveAll();
            });
        }

        // Архив
        if (this.clearArchiveBtn) {
            this.clearArchiveBtn.addEventListener('click', () => this.clearArchive());
        }

        // AI заглушка
        if (this.aiFab) {
            this.aiFab.addEventListener('click', () => {
                this.showToast('✨ AI-помощник в разработке', 2000);
            });
        }

        // Авто-тема при изменении системной
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (this.settings.theme === 'auto') {
                this.applySettings();
            }
        });
        
        console.log('initEventListeners completed');
    }

    // ===== УПРАВЛЕНИЕ МЕНЮ =====
    toggleMenu() {
        if (this.sideMenu) {
            this.sideMenu.classList.toggle('hidden');
        }
    }

    // ===== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК =====
    switchTab(tab) {
        this.currentTab = tab;
        
        // Обновляем заголовок
        const titles = {
            tasks: 'Мой день',
            stats: 'Статистика',
            archive: 'Архив',
            achievements: 'Достижения'
        };
        if (this.headerTitle) {
            this.headerTitle.textContent = titles[tab] || 'Мой день';
        }

        // Скрываем все вкладки
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        
        // Показываем нужную
        if (tab === 'tasks' && this.tasksTab) {
            this.tasksTab.classList.add('active');
        } else if (tab === 'stats' && this.statsTab) {
            this.statsTab.classList.add('active');
            this.updateStats();
            this.initChart();
        } else if (tab === 'archive' && this.archiveTab) {
            this.archiveTab.classList.add('active');
            this.renderArchive();
        } else if (tab === 'achievements' && this.achievementsTab) {
            this.achievementsTab.classList.add('active');
            this.renderAchievements();
        }

        // Обновляем активный пункт меню
        if (this.menuItems) {
            this.menuItems.forEach(item => {
                if (item.dataset.tab === tab) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }
    }

    // ===== БЫСТРОЕ ДОБАВЛЕНИЕ =====
    quickAddTask() {
        if (!this.quickInput) return;
        
        const text = this.quickInput.value.trim();
        if (!text) return;

        const newTask = {
            id: Date.now(),
            text: text,
            description: '',
            categoryId: 'personal',
            priority: 'medium',
            dueDate: new Date().toISOString().split('T')[0],
            repeat: '',
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null,
            subtasks: [],
            archived: false
        };

        this.tasks.push(newTask);
        this.playSound('add');
        this.vibrate(20);
        this.saveAll();
        this.render();
        this.quickInput.value = '';
        this.quickInput.focus();
    }

    // ===== ОТКРЫТИЕ МОДАЛКИ ЗАДАЧИ =====
    openTaskModal(task = null) {
        console.log('openTaskModal called', task);
        
        // Проверяем, что все необходимые элементы существуют
        if (!this.taskModal) {
            console.error('taskModal not found');
            return;
        }
        
        if (!this.taskForm) {
            console.error('taskForm not found');
            return;
        }
        
        this.editingTaskId = task ? task.id : null;
        
        if (this.modalTitle) {
            this.modalTitle.textContent = task ? 'Редактировать' : 'Новая задача';
        }
        
        // Заполняем категории
        this.populateCategories();
        
        // Очищаем форму
        this.taskForm.reset();
        if (this.subtasksContainer) {
            this.subtasksContainer.innerHTML = '';
        }
        
        if (task) {
            if (this.taskText) this.taskText.value = task.text || '';
            if (this.taskDescription) this.taskDescription.value = task.description || '';
            if (this.taskCategory) this.taskCategory.value = task.categoryId || 'personal';
            if (this.taskPriority) this.taskPriority.value = task.priority || 'medium';
            if (this.taskDate) this.taskDate.value = task.dueDate || new Date().toISOString().split('T')[0];
            if (this.taskRepeat) this.taskRepeat.value = task.repeat || '';
            
            // Подзадачи
            if (task.subtasks && task.subtasks.length && this.subtasksContainer) {
                task.subtasks.forEach(sub => this.addSubtaskField(sub.text));
            }
        } else {
            if (this.taskDate) {
                this.taskDate.value = new Date().toISOString().split('T')[0];
            }
        }
        
        // Открываем модальное окно
        this.taskModal.classList.remove('hidden');
        console.log('Task modal opened');
    }

    // ===== ЗАПОЛНЕНИЕ КАТЕГОРИЙ =====
    populateCategories() {
        if (!this.taskCategory) return;
        
        this.taskCategory.innerHTML = '';
        this.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = `${cat.icon} ${cat.name}`;
            this.taskCategory.appendChild(option);
        });
    }

    // ===== ДОБАВЛЕНИЕ ПОЛЯ ПОДЗАДАЧИ =====
    addSubtaskField(value = '') {
        if (!this.subtasksContainer) return;
        
        const div = document.createElement('div');
        div.className = 'subtask-item';
        div.innerHTML = `
            <input type="text" placeholder="Подзадача..." value="${value.replace(/"/g, '&quot;')}">
            <button type="button" class="remove-subtask">×</button>
        `;
        
        div.querySelector('.remove-subtask').addEventListener('click', () => {
            div.remove();
        });
        
        this.subtasksContainer.appendChild(div);
    }

    // ===== СОХРАНЕНИЕ ЗАДАЧИ =====
    saveTask() {
        if (!this.taskForm) return;
        
        const subtasks = [];
        document.querySelectorAll('.subtask-item input').forEach(input => {
            if (input.value.trim()) {
                subtasks.push({
                    id: Date.now() + Math.random(),
                    text: input.value.trim(),
                    completed: false
                });
            }
        });

        const taskData = {
            id: this.editingTaskId || Date.now(),
            text: this.taskText ? this.taskText.value : '',
            description: this.taskDescription ? this.taskDescription.value : '',
            categoryId: this.taskCategory ? this.taskCategory.value : 'personal',
            priority: this.taskPriority ? this.taskPriority.value : 'medium',
            dueDate: this.taskDate ? this.taskDate.value : new Date().toISOString().split('T')[0],
            repeat: this.taskRepeat ? this.taskRepeat.value : '',
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null,
            subtasks: subtasks,
            archived: false
        };

        if (this.editingTaskId) {
            const index = this.tasks.findIndex(t => t.id === this.editingTaskId);
            if (index !== -1) {
                this.tasks[index] = { ...this.tasks[index], ...taskData };
            }
        } else {
            this.tasks.push(taskData);
        }

        this.playSound('save');
        this.vibrate(20);
        this.saveAll();
        this.render();
        
        if (this.taskModal) {
            this.closeModal(this.taskModal);
        }
    }

    // ===== ПЕРЕКЛЮЧЕНИЕ ВЫПОЛНЕНИЯ =====
    async toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;

        if (task.completed) {
            // Начисляем очки
            const points = task.priority === 'high' ? 20 : task.priority === 'medium' ? 10 : 5;
            this.addPoints(points);
            
            // Проверяем подзадачи
            if (task.subtasks && task.subtasks.length) {
                task.subtasks.forEach(sub => sub.completed = true);
            }

            // Проверяем достижения
            this.checkAchievements();

            // Если повторяющаяся - создаём новую
            if (task.repeat) {
                this.createRepeatingTask(task);
            }

            this.playSound('complete');
            this.vibrate(30);
        }

        this.saveAll();
        this.render();
    }

    // ===== НАЧИСЛЕНИЕ ОЧКОВ =====
    addPoints(amount) {
        this.stats.points += amount;
        this.stats.level = Math.floor(Math.sqrt(this.stats.points / 50)) + 1;
        
        // Обновляем streak
        this.updateStreak();
        
        this.saveAll();
        this.updateStatsDisplay();
    }

    // ===== ОБНОВЛЕНИЕ STREAK =====
    updateStreak() {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (this.stats.lastStreakDate !== today) {
            // Проверяем, были ли выполненные задачи сегодня
            const completedToday = this.tasks.some(t => 
                t.completed && t.completedAt && t.completedAt.startsWith(new Date().toISOString().split('T')[0])
            );
            
            if (completedToday) {
                if (this.stats.lastStreakDate === yesterday) {
                    this.stats.streak++;
                } else if (this.stats.lastStreakDate !== today) {
                    this.stats.streak = 1;
                }
                this.stats.lastStreakDate = today;
            }
        }
    }

    // ===== ПРОВЕРКА STREAK =====
    checkStreak() {
        const today = new Date().toDateString();
        if (this.stats.lastStreakDate && this.stats.lastStreakDate !== today) {
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            if (this.stats.lastStreakDate !== yesterday) {
                this.stats.streak = 0;
            }
        }
        this.saveAll();
    }

    // ===== СОЗДАНИЕ ПОВТОРЯЮЩЕЙСЯ ЗАДАЧИ =====
    createRepeatingTask(originalTask) {
        const newTask = { ...originalTask, id: Date.now(), completed: false, completedAt: null };
        
        const nextDate = new Date(originalTask.dueDate);
        if (originalTask.repeat === 'daily') nextDate.setDate(nextDate.getDate() + 1);
        else if (originalTask.repeat === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        else if (originalTask.repeat === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        
        newTask.dueDate = nextDate.toISOString().split('T')[0];
        this.tasks.push(newTask);
    }

    // ===== УДАЛЕНИЕ ЗАДАЧИ =====
    deleteTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task && task.completed) {
            // Если выполнена, отправляем в архив
            this.archive.push({ ...task, archivedAt: new Date().toISOString() });
        }
        
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.playSound('delete');
        this.vibrate(20);
        this.saveAll();
        this.render();
    }

    // ===== АРХИВ =====
    renderArchive() {
        if (!this.archiveList) return;
        
        this.archiveList.innerHTML = '';
        
        if (this.archive.length === 0) {
            this.archiveList.innerHTML = '<div class="empty-state">Архив пуст</div>';
            return;
        }

        this.archive.slice().reverse().forEach(task => {
            const li = document.createElement('li');
            li.className = 'archive-item completed';
            li.innerHTML = `
                <span class="task-text">${task.text.replace(/</g, '&lt;')}</span>
                <button class="restore-btn" data-id="${task.id}">↩️</button>
            `;
            
            li.querySelector('.restore-btn').addEventListener('click', () => {
                this.restoreFromArchive(task);
            });
            
            this.archiveList.appendChild(li);
        });
    }

    restoreFromArchive(task) {
        const newTask = { ...task, id: Date.now(), completed: false, archived: false };
        this.tasks.push(newTask);
        this.archive = this.archive.filter(t => t.id !== task.id);
        this.saveAll();
        this.render();
        this.renderArchive();
    }

    clearArchive() {
        if (confirm('Очистить архив?')) {
            this.archive = [];
            this.saveAll();
            this.renderArchive();
        }
    }

    // ===== ДОСТИЖЕНИЯ =====
    checkAchievements() {
        const completedTasks = this.tasks.filter(t => t.completed);
        const today = new Date().toISOString().split('T')[0];
        const completedToday = completedTasks.filter(t => t.completedAt && t.completedAt.startsWith(today)).length;
        
        // Первая задача
        if (completedTasks.length >= 1 && !this.achievementsList.find(a => a.id === 'first_task').unlocked) {
            this.unlockAchievement('first_task');
        }

        // 5 задач за день
        if (completedToday >= 5 && !this.achievementsList.find(a => a.id === 'five_tasks').unlocked) {
            this.unlockAchievement('five_tasks');
        }

        // 10 задач за день
        if (completedToday >= 10 && !this.achievementsList.find(a => a.id === 'ten_tasks').unlocked) {
            this.unlockAchievement('ten_tasks');
        }

        // Недельный streak
        if (this.stats.streak >= 7 && !this.achievementsList.find(a => a.id === 'week_streak').unlocked) {
            this.unlockAchievement('week_streak');
        }

        // Месячный streak
        if (this.stats.streak >= 30 && !this.achievementsList.find(a => a.id === 'month_streak').unlocked) {
            this.unlockAchievement('month_streak');
        }

        // Важные задачи
        const highPriorityCompleted = completedTasks.filter(t => t.priority === 'high').length;
        if (highPriorityCompleted >= 10 && !this.achievementsList.find(a => a.id === 'high_priority').unlocked) {
            this.unlockAchievement('high_priority');
        }

        // Все категории
        const categoriesUsed = [...new Set(completedTasks.map(t => t.categoryId))];
        if (categoriesUsed.length >= this.categories.length && !this.achievementsList.find(a => a.id === 'category_master').unlocked) {
            this.unlockAchievement('category_master');
        }

        // Очки
        if (this.stats.points >= 100 && !this.achievementsList.find(a => a.id === 'points_100').unlocked) {
            this.unlockAchievement('points_100');
        }
        if (this.stats.points >= 500 && !this.achievementsList.find(a => a.id === 'points_500').unlocked) {
            this.unlockAchievement('points_500');
        }

        // Архив
        if (this.archive.length >= 10 && !this.achievementsList.find(a => a.id === 'archive_10').unlocked) {
            this.unlockAchievement('archive_10');
        }
    }

    unlockAchievement(achievementId) {
        const achievement = this.achievementsList.find(a => a.id === achievementId);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            this.showAchievementToast(achievement);
            this.playSound('achievement');
            this.vibrate(50);
            this.saveAll();
        }
    }

    showAchievementToast(achievement) {
        if (!this.achievementToast || !this.toastMessage) return;
        
        this.toastMessage.textContent = `${achievement.name}: ${achievement.desc}`;
        this.achievementToast.classList.remove('hidden');
        
        setTimeout(() => {
            if (this.achievementToast) {
                this.achievementToast.classList.add('hidden');
            }
        }, 3000);
    }

    renderAchievements() {
        if (!this.achievementsGrid) return;
        
        this.achievementsGrid.innerHTML = '';
        this.achievementsList.forEach(ach => {
            const card = document.createElement('div');
            card.className = `achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`;
            card.innerHTML = `
                <div class="achievement-icon">${ach.icon}</div>
                <div class="achievement-name">${ach.name}</div>
                <div class="achievement-desc">${ach.desc}</div>
            `;
            this.achievementsGrid.appendChild(card);
        });
    }

    // ===== СТАТИСТИКА =====
    updateStats() {
        const today = new Date().toISOString().split('T')[0];
        const completedToday = this.tasks.filter(t => t.completed && t.completedAt && t.completedAt.startsWith(today)).length;
        
        if (this.statToday) this.statToday.textContent = completedToday;
        if (this.statPoints) this.statPoints.textContent = this.stats.points;
        if (this.statStreak) this.statStreak.textContent = this.stats.streak;
        if (this.statLevel) this.statLevel.textContent = this.stats.level;
    }

    updateStatsDisplay() {
        if (this.streakDisplay) {
            this.streakDisplay.textContent = this.stats.streak;
        }
        if (this.pointsDisplay) {
            this.pointsDisplay.textContent = this.stats.points;
        }
        if (this.levelDisplay) {
            this.levelDisplay.textContent = this.stats.level;
        }
        if (this.menuStreak) {
            this.menuStreak.textContent = this.stats.streak;
        }
    }

    // ===== ГРАФИК =====
    initChart() {
        const canvas = document.getElementById('weeklyChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Получаем данные за последние 7 дней
        const labels = [];
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
            labels.push(dayName);
            
            const count = this.tasks.filter(t => t.completed && t.completedAt && t.completedAt.startsWith(dateStr)).length;
            data.push(count);
        }

        if (this.weeklyChart) {
            this.weeklyChart.destroy();
        }

        try {
            this.weeklyChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Выполнено задач',
                        data: data,
                        borderColor: this.settings.accentColor,
                        backgroundColor: this.settings.accentColor + '20',
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'var(--border-light)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        } catch (e) {
            console.error('Chart error:', e);
        }
    }

    // ===== УВЕДОМЛЕНИЯ =====
    async requestNotificationPermission() {
        if (!('Notification' in window)) return;
        
        if (Notification.permission === 'default' && this.settings.notifications) {
            await Notification.requestPermission();
        }
    }

    showNotification(title, body) {
        if (Notification.permission === 'granted' && this.settings.notifications) {
            new Notification(title, { body });
        }
    }

    // ===== ЗВУКИ =====
    playSound(type) {
        if (!this.settings.sound) return;
        
        const sounds = {
            add: 65,
            complete: 523.25,
            delete: 220,
            save: 440,
            achievement: 880
        };
        
        if (!sounds[type]) return;
        
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.frequency.value = sounds[type];
            gainNode.gain.value = 0.1;
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
        } catch (e) {
            console.log('Аудио не поддерживается');
        }
    }

    // ===== ВИБРАЦИЯ =====
    vibrate(duration) {
        if (this.settings.vibration && navigator.vibrate) {
            navigator.vibrate(duration);
        }
    }

    // ===== TOAST =====
    showToast(message, duration = 2000) {
        const toast = document.createElement('div');
        toast.className = 'achievement-toast';
        toast.style.animation = 'slideUpToast 0.3s ease';
        toast.innerHTML = `
            <div class="toast-icon">ℹ️</div>
            <div class="toast-content">
                <div class="toast-message">${message.replace(/</g, '&lt;')}</div>
            </div>
        `;
        
        const app = document.querySelector('.app');
        if (app) {
            app.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, duration);
        }
    }

    // ===== DRAG & DROP =====
    initSortable() {
        if (this.settings.sort !== 'manual') {
            if (this.sortableInstance) {
                this.sortableInstance.destroy();
                this.sortableInstance = null;
            }
            return;
        }

        const taskListEl = document.getElementById('taskList');
        if (!taskListEl) return;

        if (this.sortableInstance) {
            this.sortableInstance.destroy();
        }

        if (typeof Sortable === 'undefined') {
            console.warn('Sortable not loaded');
            return;
        }

        this.sortableInstance = new Sortable(taskListEl, {
            animation: 200,
            handle: '.task-item',
            draggable: '.task-item',
            ghostClass: 'task-item-ghost',
            onEnd: (evt) => {
                const newOrder = [];
                const items = taskListEl.querySelectorAll('.task-item');
                items.forEach(item => newOrder.push(Number(item.dataset.id)));

                const tasksMap = new Map(this.tasks.map(t => [t.id, t]));
                this.tasks = newOrder.map(id => tasksMap.get(id)).filter(t => t);
                
                this.saveAll();
            }
        });
    }

    // ===== СВАЙПЫ =====
    attachSwipeListeners() {
        // Удаляем старые обработчики
        this.swipeHandlers.forEach((handlers, element) => {
            element.removeEventListener('touchstart', handlers.start);
            element.removeEventListener('touchmove', handlers.move);
            element.removeEventListener('touchend', handlers.end);
        });
        this.swipeHandlers.clear();

        const items = document.querySelectorAll('.task-item');
        items.forEach(item => {
            let startX = 0;
            let currentX = 0;
            let isSwiping = false;
            const threshold = 80;

            const onTouchStart = (e) => {
                startX = e.touches[0].clientX;
                isSwiping = true;
            };

            const onTouchMove = (e) => {
                if (!isSwiping) return;
                currentX = e.touches[0].clientX;
                
                // Небольшой визуальный отклик
                const diff = currentX - startX;
                if (Math.abs(diff) > 20) {
                    item.style.transform = `translateX(${diff * 0.3}px)`;
                    item.style.opacity = 1 - Math.abs(diff) * 0.002;
                }
            };

            const onTouchEnd = (e) => {
                if (!isSwiping) return;
                
                const diff = currentX - startX;
                const taskId = Number(item.dataset.id);
                
                if (Math.abs(diff) > threshold) {
                    if (diff > 0) { // Вправо - выполнить
                        this.toggleTask(taskId);
                    } else { // Влево - удалить
                        this.deleteTask(taskId);
                    }
                }
                
                // Сброс трансформации
                item.style.transform = '';
                item.style.opacity = '';
                isSwiping = false;
            };

            // Сохраняем обработчики
            const handlers = { start: onTouchStart, move: onTouchMove, end: onTouchEnd };
            item.addEventListener('touchstart', onTouchStart);
            item.addEventListener('touchmove', onTouchMove);
            item.addEventListener('touchend', onTouchEnd);
            this.swipeHandlers.set(item, handlers);
        });
    }

    // ===== ОТРИСОВКА =====
    render() {
        if (!this.taskList) return;
        
        this.taskList.innerHTML = '';
        
        if (this.tasks.length === 0) {
            if (this.emptyState) {
                this.emptyState.style.display = 'block';
            }
        } else {
            if (this.emptyState) {
                this.emptyState.style.display = 'none';
            }
            
            let sortedTasks = [...this.tasks].filter(t => !t.archived);
            
            // Сортировка
            if (this.settings.sort === 'priority') {
                const priorityOrder = { high: 1, medium: 2, low: 3 };
                sortedTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
            } else if (this.settings.sort === 'date') {
                sortedTasks.sort((a, b) => (a.dueDate || '') < (b.dueDate || '') ? -1 : 1);
            }

            sortedTasks.forEach(task => {
                const li = this.createTaskElement(task);
                if (li) {
                    this.taskList.appendChild(li);
                }
            });
        }

        // Обновляем статистику
        this.updateStatsDisplay();
        this.updateStats();
        
        // Инициализируем drag & drop и свайпы
        this.initSortable();
        this.attachSwipeListeners();
        
        // Проверяем streak
        this.updateStreak();
    }

    createTaskElement(task) {
        if (!task) return null;
        
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;

        // Чекбокс
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            this.toggleTask(task.id);
        });

        // Контент
        const content = document.createElement('div');
        content.className = 'task-content';

        const text = document.createElement('div');
        text.className = 'task-text';
        text.textContent = task.text;

        const meta = document.createElement('div');
        meta.className = 'task-meta';

        // Категория
        const category = this.categories.find(c => c.id === task.categoryId);
        if (category) {
            const catSpan = document.createElement('span');
            catSpan.className = 'category-badge';
            catSpan.style.backgroundColor = category.color + '20';
            catSpan.style.color = category.color;
            catSpan.textContent = `${category.icon} ${category.name}`;
            meta.appendChild(catSpan);
        }

        // Приоритет
        const prioritySpan = document.createElement('span');
        prioritySpan.className = 'priority-badge';
        const priorityIcons = { high: '🔴', medium: '🟡', low: '🟢' };
        prioritySpan.textContent = `${priorityIcons[task.priority] || '⚪'} ${task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий'}`;
        meta.appendChild(prioritySpan);

        // Дата
        if (task.dueDate) {
            const dateSpan = document.createElement('span');
            dateSpan.className = 'due-badge';
            const today = new Date().toISOString().split('T')[0];
            if (task.dueDate === today) {
                dateSpan.textContent = '📅 Сегодня';
            } else {
                try {
                    const date = new Date(task.dueDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                    dateSpan.textContent = `📅 ${date}`;
                } catch (e) {
                    dateSpan.textContent = '📅 Дата';
                }
            }
            meta.appendChild(dateSpan);
        }

        // Подзадачи (счётчик)
        if (task.subtasks && task.subtasks.length > 0) {
            const completedSubtasks = task.subtasks.filter(s => s.completed).length;
            const subtaskSpan = document.createElement('span');
            subtaskSpan.className = 'due-badge';
            subtaskSpan.textContent = `📋 ${completedSubtasks}/${task.subtasks.length}`;
            meta.appendChild(subtaskSpan);
        }

        content.appendChild(text);
        content.appendChild(meta);

        // Кнопка удаления
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteTask(task.id);
        });

        li.appendChild(checkbox);
        li.appendChild(content);
        li.appendChild(deleteBtn);

        // Клик для редактирования
        li.addEventListener('click', (e) => {
            if (e.target === checkbox || e.target === deleteBtn) return;
            this.openTaskModal(task);
        });

        return li;
    }

    // ===== ВСПОМОГАТЕЛЬНЫЕ =====
    closeModal(modalElement) {
        console.log('closeModal called for:', modalElement);
        
        if (modalElement && modalElement.classList) {
            modalElement.classList.add('hidden');
            console.log('Modal hidden, classes:', modalElement.className);
            
            if (modalElement === this.taskModal) {
                this.editingTaskId = null;
            }
        } else {
            console.error('closeModal: invalid element', modalElement);
        }
    }
}

// ===== ЗАПУСК =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting TaskManager');
    try {
        new TaskManager();
        console.log('TaskManager started successfully');
    } catch (e) {
        console.error('Error starting TaskManager:', e);
    }
});

// Глобальная обработка ошибок
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});