const Utils = {
    // Returns YYYY-MM-DD string for a given Date object (using Local Time)
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // Returns number of days between a start date string (YYYY-MM-DD) and today
    calculateDaysDiff(startDateStr) {
        if (!startDateStr) return 0;

        // Parse YYYY-MM-DD to local midnight
        const [y, m, d] = startDateStr.split('-').map(Number);
        const start = new Date(y, m - 1, d);

        // Today at midnight
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const diffTime = today - start;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 ? diffDays : 0;
    }
};

const Store = {
    key: 'sobrius_data',
    defaults: {
        user: {
            name: 'Lucas Silva',
            email: 'lucas@example.com',
            level: 3,
            bio: 'Focado na recuperação um dia de cada vez.',
            // Default start date: 23/11/2025
            startDate: '2025-11-23'
        },
        isLoggedIn: false,
        relapses: ['2025-11-22'], // Default relapse: 22/11/2025
        journal: [],
        posts: [
            { id: 1, user: 'Ana Paula', time: '2 horas atrás', text: 'Hoje completei 30 dias de sobriedade! Muito feliz com essa conquista. Obrigado a todos pelo apoio.', likes: 5 },
            { id: 2, user: 'Carlos Eduardo', time: '5 horas atrás', text: 'Dia difícil hoje, mas me mantive forte. A caminhada matinal ajudou muito a clarear a mente.', likes: 2 }
        ]
    },

    get() {
        const data = localStorage.getItem(this.key);
        let parsed = data ? JSON.parse(data) : JSON.parse(JSON.stringify(this.defaults));

        return parsed;
    },

    save(data) {
        localStorage.setItem(this.key, JSON.stringify(data));
        App.render();
    },

    update(updater) {
        const data = this.get();
        updater(data);
        this.save(data);
    }
};

const App = {
    init() {
        this.cacheDOM();
        this.bindEvents();

        // Force start at login view (User Request)
        this.navigateTo('login-view');
        this.bottomNav.classList.add('hidden');

        this.render();
    },

    cacheDOM() {
        this.views = document.querySelectorAll('.view');
        this.navItems = document.querySelectorAll('.nav-item');
        this.bottomNav = document.getElementById('bottom-nav');
        this.loginForm = document.getElementById('login-form');

        // Home View Elements
        this.daysCount = document.querySelector('.days-count');
        this.userLevel = document.querySelector('.progress-info h3');

        // Journal Elements
        this.journalForm = document.querySelector('.journal-form'); // First one (Check-in)
        this.relapseForm = document.querySelectorAll('.journal-form')[1]; // Second one (Relapse)

        // Calendar Elements
        this.calendarGrid = document.querySelector('.calendar-grid');

        // Community Elements
        this.communityFeed = document.querySelector('#community-view .content-scroll');
    },

    bindEvents() {
        // Navigation
        this.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetId = item.dataset.target;
                this.navigateTo(targetId);
            });
        });

        // Login
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Journal Check-in
        const checkinBtn = this.journalForm.querySelector('.btn-primary');
        if (checkinBtn) {
            checkinBtn.addEventListener('click', () => this.handleCheckin());
        }

        // Relapse Registration
        const relapseBtn = this.relapseForm.querySelector('.btn-danger');
        if (relapseBtn) {
            relapseBtn.addEventListener('click', () => this.handleRelapse());
        }

        // Contact Button
        const contactBtn = document.querySelector('.sticky-bottom-btn');
        if (contactBtn) {
            contactBtn.addEventListener('click', () => alert('Iniciando chamada para a unidade mais próxima...'));
        }
    },

    navigateTo(targetId) {
        this.views.forEach(view => view.classList.remove('active'));
        const targetView = document.getElementById(targetId);
        if (targetView) targetView.classList.add('active');

        this.navItems.forEach(item => {
            if (item.dataset.target === targetId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Re-render specific views if needed
        if (targetId === 'calendar-view') this.renderCalendar();
        if (targetId === 'community-view') this.renderCommunity();
    },

    handleLogin() {
        const btn = this.loginForm.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.innerText = 'Entrando...';

        setTimeout(() => {
            Store.update(data => {
                data.isLoggedIn = true;
            });

            this.navigateTo('home-view');
            this.bottomNav.classList.remove('hidden');
            btn.innerText = originalText;
        }, 800);
    },

    handleCheckin() {
        const mood = this.journalForm.querySelector('select').value;
        const notes = this.journalForm.querySelector('textarea').value;

        Store.update(data => {
            data.journal.push({
                date: new Date().toISOString(),
                mood,
                notes,
                type: 'checkin'
            });
        });

        alert('Check-in salvo com sucesso! Continue assim.');
        this.journalForm.reset();
    },

    handleRelapse() {
        const dateInput = this.relapseForm.querySelector('input[type="date"]').value;
        const reason = this.relapseForm.querySelector('textarea').value;

        if (!dateInput) {
            alert('Por favor, selecione a data.');
            return;
        }

        Store.update(data => {
            // dateInput is already YYYY-MM-DD from input[type=date]
            data.relapses.push(dateInput);
            data.user.startDate = dateInput;

            data.journal.push({
                date: new Date().toISOString(),
                relapseDate: dateInput,
                reason,
                type: 'relapse'
            });
        });

        alert('Recaída registrada. O importante é não desistir. Seu contador foi reiniciado.');
        this.relapseForm.reset();
        this.navigateTo('home-view');
    },

    render() {
        const data = Store.get();
        const days = Utils.calculateDaysDiff(data.user.startDate);
        if (this.daysCount) this.daysCount.innerText = days;
        if (this.userLevel) this.userLevel.innerText = `Nível ${Math.floor(days / 7) + 1}`;
    },

    renderCalendar() {
        const data = Store.get();
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Clear existing days (keep headers)
        const headers = Array.from(this.calendarGrid.querySelectorAll('.header'));
        this.calendarGrid.innerHTML = '';
        headers.forEach(h => this.calendarGrid.appendChild(h));

        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

        // Empty slots
        for (let i = 0; i < firstDayIndex; i++) {
            const empty = document.createElement('div');
            empty.className = 'cal-day empty';
            this.calendarGrid.appendChild(empty);
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'cal-day sober';
            dayEl.innerText = i;

            // Construct local YYYY-MM-DD
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

            // Check if start date
            if (data.user.startDate === dateStr) {
                dayEl.className = 'cal-day start';
            }

            // Check if relapse (Prioritize over start date)
            if (data.relapses.includes(dateStr)) {
                dayEl.className = 'cal-day relapse';
            }

            // Check if today
            const todayStr = Utils.formatDate(today);
            if (todayStr === dateStr) {
                dayEl.classList.add('today');
            }

            this.calendarGrid.appendChild(dayEl);
        }
    },

    renderCommunity() {
        const data = Store.get();
        // Clear existing posts (except the button if we had one, but here we rebuild)
        // For simplicity, we just rebuild the list
        // Note: In a real app we'd append or diff.

        // We need to keep the header, so let's just clear the posts if we wrap them in a container.
        // But our HTML structure has posts directly in content-scroll. 
        // Let's clear everything after the header if possible, or just re-render the posts container.
        // To avoid destroying the layout, let's look at index.html structure again.
        // It has <div class="card post-card">...

        // Let's remove all .post-card elements and rebuild
        const existingPosts = this.communityFeed.querySelectorAll('.post-card');
        existingPosts.forEach(p => p.remove());

        data.posts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'card post-card';
            card.innerHTML = `
                <div class="post-header">
                    <div class="avatar-small"></div>
                    <div class="post-meta">
                        <span class="username">${post.user}</span>
                        <span class="date">${post.time}</span>
                    </div>
                </div>
                <p class="post-text">${post.text}</p>
                <button class="btn btn-text">Adicionar Comentário (${post.likes || 0} curtidas)</button>
            `;
            this.communityFeed.appendChild(card);
        });
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
