/**
 * ================================================================
 * CIPHERSTRIKE CTF — ctf.js
 * ================================================================
 */

(function () {

    const API_BASE  = '/api';
    const TOKEN_KEY = 'vault_bearer_token';

    let currentUser      = null;
    let allChallenges    = [];
    let solvedIds        = new Set();
    let currentChallenge = null;
    let hintUsed         = false;
    let currentFilter    = 'all';
    let ctfEndTime       = null;

    // ── AUTH CHECK ──────────────────────────────────────────────
    async function init() {
        const token = sessionStorage.getItem(TOKEN_KEY);
        if (!token) { window.location.href = '/'; return; }

        try {
            const res  = await api('GET', '/user');
            currentUser = res;
            document.getElementById('userGreeting').textContent = res.name;
            document.getElementById('profileName').textContent  = res.name;
            document.getElementById('profileEmail').textContent = res.email;
        } catch {
            window.location.href = '/';
            return;
        }

        setupTabs();
        setupCategoryFilter();
        setupTimer();
        await Promise.all([loadChallenges(), loadScoreboard()]);
    }

    // ── API HELPER ───────────────────────────────────────────────
    async function api(method, endpoint, body = null) {
        const token   = sessionStorage.getItem(TOKEN_KEY);
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const opts    = { method, headers };
        if (body) opts.body = JSON.stringify(body);
        const res     = await fetch(`${API_BASE}${endpoint}`, opts);
        const data    = await res.json();
        if (!res.ok) throw new Error(data.message || 'Request failed');
        return data;
    }

    // ── TABS ─────────────────────────────────────────────────────
    function setupTabs() {
        document.querySelectorAll('.ctf-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.ctf-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
                if (tab.dataset.tab === 'scoreboard') loadScoreboard();
                if (tab.dataset.tab === 'profile')    renderProfile();
            });
        });
    }

    // ── CATEGORY FILTER ──────────────────────────────────────────
    function setupCategoryFilter() {
        document.querySelectorAll('.cat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.cat;
                renderChallenges();
            });
        });
    }

    // ── TIMER ────────────────────────────────────────────────────
    function setupTimer() {
        // Set CTF end time — change this to your actual competition end time
        ctfEndTime = new Date('2026-06-01T23:59:00');
        updateTimer();
        setInterval(updateTimer, 1000);
    }

    function updateTimer() {
        const now  = new Date();
        const diff = ctfEndTime - now;
        const el   = document.getElementById('ctfTimer');
        if (diff <= 0) { el.textContent = 'ENDED'; el.style.color = '#64748b'; return; }
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        el.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }

    // ── LOAD CHALLENGES ──────────────────────────────────────────
    async function loadChallenges() {
        try {
            const data   = await api('GET', '/ctf/challenges');
            allChallenges = data.challenges;
            solvedIds     = new Set(data.solved_ids);
            renderChallenges();
            updateStats();
        } catch (err) {
            document.getElementById('challengesGrid').innerHTML =
                `<div class="empty-state"><p>Failed to load challenges: ${err.message}</p></div>`;
        }
    }

    // ── RENDER CHALLENGES ─────────────────────────────────────────
    const catIcons = { web:'🌍', crypto:'🔐', forensics:'🔬', reverse:'⚙️', osint:'🕵️', misc:'🎯' };
    const catColors = { web:'#38bdf8', crypto:'#a855f7', forensics:'#22c55e', reverse:'#f97316', osint:'#eab308', misc:'#f43f5e' };

    function renderChallenges() {
        const grid      = document.getElementById('challengesGrid');
        const filtered  = currentFilter === 'all'
            ? allChallenges
            : allChallenges.filter(c => c.category === currentFilter);

        if (!filtered.length) {
            grid.innerHTML = `<div class="empty-state"><i class="fas fa-flag" style="font-size:48px;color:#1e2a4a;"></i><p>No challenges in this category yet.</p></div>`;
            return;
        }

        grid.innerHTML = filtered.map(ch => {
            const solved  = solvedIds.has(ch.id);
            const icon    = catIcons[ch.category]   || '🎯';
            const color   = catColors[ch.category]  || '#f43f5e';
            const diffCls = { easy:'diff-easy', medium:'diff-medium', hard:'diff-hard', insane:'diff-insane' }[ch.difficulty] || 'diff-easy';
            return `
            <div class="challenge-card ${solved ? 'solved' : ''}"
                 style="--cat-color:${color}"
                 onclick="openChallenge(${ch.id})">
                <span class="challenge-cat-icon">${icon}</span>
                <div class="challenge-title">${escHtml(ch.title)}</div>
                <div class="challenge-desc-preview">${escHtml(ch.description)}</div>
                <div class="challenge-footer">
                    <span class="challenge-points">${ch.points} pts</span>
                    <span class="difficulty-badge ${diffCls}">${ch.difficulty}</span>
                    <span class="solves-count"><i class="fas fa-users"></i> ${ch.solves_count || 0}</span>
                </div>
            </div>`;
        }).join('');
    }

    // ── UPDATE STATS ─────────────────────────────────────────────
    function updateStats() {
        const solved = solvedIds.size;
        const total  = allChallenges.length;
        const pts    = allChallenges.filter(c => solvedIds.has(c.id)).reduce((a,c) => a + c.points, 0);
        document.getElementById('statSolved').textContent = solved;
        document.getElementById('statTotal').textContent  = total;
        document.getElementById('statPoints').textContent = pts;
        document.getElementById('userScore').textContent  = `${pts} pts`;
    }

    // ── OPEN CHALLENGE MODAL ──────────────────────────────────────
    window.openChallenge = function(id) {
        const ch = allChallenges.find(c => c.id === id);
        if (!ch) return;
        currentChallenge = ch;
        hintUsed         = false;

        const solved = solvedIds.has(ch.id);
        const icon   = catIcons[ch.category] || '🎯';
        const diffCls = { easy:'diff-easy', medium:'diff-medium', hard:'diff-hard', insane:'diff-insane' }[ch.difficulty] || 'diff-easy';

        document.getElementById('modalTitle').textContent       = `${icon} ${ch.title}`;
        document.getElementById('modalDescription').innerHTML = ch.description;
        document.getElementById('modalCategory').textContent    = ch.category.toUpperCase();
        document.getElementById('modalDifficulty').className    = `badge ${diffCls}`;
        document.getElementById('modalDifficulty').textContent  = ch.difficulty.toUpperCase();
        document.getElementById('modalPoints').textContent      = `${ch.points} pts`;
        document.getElementById('flagInput').value              = '';
        document.getElementById('flagFeedback').style.display   = 'none';
        document.getElementById('hintText').style.display       = 'none';
        document.getElementById('hintBtn').style.display        = ch.hint ? 'inline-flex' : 'none';

        // Attachment
        const attEl = document.getElementById('modalAttachment');
        if (ch.attachment_url) {
            attEl.style.display = 'block';
            document.getElementById('attachmentLink').href = ch.attachment_url;
        } else {
            attEl.style.display = 'none';
        }

        // Solved state
        document.getElementById('solvedBadge').style.display      = solved ? 'block' : 'none';
        document.getElementById('flagSubmitSection').style.display = solved ? 'none' : 'block';

        document.getElementById('challengeModal').style.display = 'flex';
    };

    window.closeModal = function() {
        document.getElementById('challengeModal').style.display = 'none';
        currentChallenge = null;
    };

    // Close on outside click
    document.getElementById('challengeModal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });

    // ── SUBMIT FLAG ───────────────────────────────────────────────
    window.submitFlag = async function() {
        if (!currentChallenge) return;
        const flag     = document.getElementById('flagInput').value.trim();
        const feedback = document.getElementById('flagFeedback');

        if (!flag) { showFeedback('Enter a flag first!', false); return; }

        try {
            const data = await api('POST', '/ctf/submit', {
                challenge_id: currentChallenge.id,
                flag,
                hint_used: hintUsed
            });

            if (data.correct) {
                triggerConfetti();
                showFeedback(`🎉 Correct! +${data.points_awarded} points!`, true);
                solvedIds.add(currentChallenge.id);
                renderChallenges();
                updateStats();
                setTimeout(closeModal, 3000);
            } else {
                showFeedback('❌ Wrong flag. Keep trying!', false);
            }
        } catch (err) {
            showFeedback(err.message, false);
        }
    };

    // Allow Enter key on flag input
    document.getElementById('flagInput').addEventListener('keypress', e => {
        if (e.key === 'Enter') submitFlag();
    });

    function showFeedback(msg, correct) {
        const el = document.getElementById('flagFeedback');
        el.textContent  = msg;
        el.className    = `flag-feedback ${correct ? 'correct' : 'wrong'}`;
        el.style.display = 'block';
    }

    // ── HINT ─────────────────────────────────────────────────────
    window.requestHint = function() {
        if (!currentChallenge || !currentChallenge.hint) return;
        if (hintUsed) {
            document.getElementById('hintText').style.display = 'block';
            document.getElementById('hintText').textContent   = currentChallenge.hint;
            return;
        }
        if (!confirm(`Using a hint costs 50 points. Continue?`)) return;
        hintUsed = true;
        document.getElementById('hintText').style.display = 'block';
        document.getElementById('hintText').textContent   = currentChallenge.hint;
        document.getElementById('hintBtn').textContent    = '💡 Hint revealed (-50 pts applied on submit)';
    };

    // ── ANIMATION ────────────────────────────────────────────────
    function triggerConfetti() {
        const container = document.getElementById('confettiContainer');
        container.innerHTML = '';
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.backgroundColor = ['#f43f5e', '#38bdf8', '#22c55e', '#eab308'][Math.floor(Math.random() * 4)];
            container.appendChild(confetti);
        }
        setTimeout(() => container.innerHTML = '', 5000);
    }

    // ── SCOREBOARD ────────────────────────────────────────────────
    window.loadScoreboard = async function() {
        const list = document.getElementById('scoreboardList');
        list.innerHTML = `<div class="empty-state"><span class="spinner"></span><p>Loading...</p></div>`;
        try {
            const data = await api('GET', '/ctf/scoreboard');
            const me   = currentUser?.id;

            if (!data.length) {
                list.innerHTML = `<div class="empty-state"><p>No players yet. Be the first!</p></div>`;
                return;
            }

            list.innerHTML = data.map((player, i) => {
                const rank    = i + 1;
                const rankCls = rank <= 3 ? `rank-${rank}` : 'rank-other';
                const rankLabel = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
                const isMe    = player.id === me;

                // Update current user rank in stats
                if (isMe) document.getElementById('statRank').textContent = `#${rank}`;

                return `
                <div class="scoreboard-row ${isMe ? 'me' : ''}">
                    <div class="rank-badge ${rankCls}">${rankLabel}</div>
                    <div class="scoreboard-name">
                        ${escHtml(player.name)}
                        ${isMe ? '<span style="font-size:0.7rem;color:#f43f5e;margin-left:4px;">(you)</span>' : ''}
                    </div>
                    <div class="scoreboard-solved">${player.solved_count} solved</div>
                    <div class="scoreboard-points">${player.total_points} pts</div>
                </div>`;
            }).join('');
        } catch (err) {
            list.innerHTML = `<div class="empty-state"><p>Failed to load scoreboard.</p></div>`;
        }
    };

    // ── PROFILE ──────────────────────────────────────────────────
    function renderProfile() {
        const solved  = allChallenges.filter(c => solvedIds.has(c.id));
        const pts     = solved.reduce((a,c) => a + c.points, 0);
        document.getElementById('profilePoints').textContent = `${pts} pts`;

        const list = document.getElementById('solvedList');
        if (!solved.length) {
            list.innerHTML = `<p style="color:#5b6e8c;">No challenges solved yet. Start hacking!</p>`;
            return;
        }
        list.innerHTML = solved.map(ch => `
            <div class="solved-item">
                <span class="solved-item-name">${catIcons[ch.category] || '🎯'} ${escHtml(ch.title)}</span>
                <span class="solved-item-points">+${ch.points} pts</span>
            </div>`).join('');
    }

    // ── LOGOUT ────────────────────────────────────────────────────
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try { await api('POST', '/logout'); } catch {}
        sessionStorage.removeItem(TOKEN_KEY);
        window.location.href = '/';
    });

    // ── UTILS ─────────────────────────────────────────────────────
    function escHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    init();

})();
