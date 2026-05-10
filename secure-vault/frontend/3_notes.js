/**
 * ================================================================
 * SECURE NOTES VAULT PRO — 3_notes.js
 * ================================================================
 * ARCHITECTURE:
 *   - Auth: Laravel Sanctum (email + password → Bearer token)
 *   - Encryption: AES-256-CBC in browser BEFORE sending to server
 *   - Server: Stores only ciphertext, iv, salt — NEVER plaintext
 *   - Token stored in sessionStorage (cleared when tab closes)
 * ================================================================
 */

(function () {

    // ──────────────────────────────────────────────────────────────
    // CONFIGURATION — change API_BASE to your Laravel server URL
    // ──────────────────────────────────────────────────────────────
    const API_BASE = 'https://secure-notes-vault-production.up.railway.app/api';   // ← YOUR PRODUCTION URL
    const TOKEN_KEY = 'vault_bearer_token';           // sessionStorage key
    const SESSION_TIMER_KEY = 'vault_session_start';
    const SALT_LENGTH = 16;
    const IV_LENGTH = 16;
    const KEY_SIZE = 256 / 32;
    const PBKDF2_ITERATIONS = 310000;

    // App state
    let notes = [];
    let sessionTimer = null;
    let timeoutMinutes = 15;
    let searchQuery = '';
    let categoryFilter = 'all';
    let currentUser = null;

    // ──────────────────────────────────────────────────────────────
    // DOM REFERENCES
    // ──────────────────────────────────────────────────────────────
    const $ = id => document.getElementById(id);

    const authScreen = $('authScreen');
    const mainApp = $('mainApp');
    const loginForm = $('loginForm');
    const registerForm = $('registerForm');
    const loginBtn = $('loginBtn');
    const registerBtn = $('registerBtn');
    const loginError = $('loginError');
    const registerError = $('registerError');
    const noteInput = $('noteInput');
    const passwordInput = $('passwordInput');
    const saveBtn = $('saveBtn');
    const notesList = $('notesList');
    const noteCounter = $('noteCounter');
    const searchInput = $('searchInput');
    const categoryFilterEl = $('categoryFilter');
    const exportBtn = $('exportBtn');
    const importBtn = $('importBtn');
    const clearAllBtn = $('clearAllBtn');
    const lockBtn = $('lockBtn');
    const settingsBtn = $('settingsBtn');
    const settingsModal = $('settingsModal');
    const timerDisplay = $('timerDisplay');
    const logoutModal = $('logoutModal');
    const confirmLogoutBtn = $('confirmLogoutBtn');
    const cancelLogoutBtn = $('cancelLogoutBtn');
    const strengthBar = $('strengthBar');
    const strengthText = $('strengthText');
    const userGreeting = $('userGreeting');

    // ══════════════════════════════════════════════════════════════
    //  INITIALIZATION
    // ══════════════════════════════════════════════════════════════
    function init() {
        // Check if user already has a token from this session
        const token = sessionStorage.getItem(TOKEN_KEY);
        if (token) {
            // Verify token is still valid by calling /api/user
            verifyToken(token);
        } else {
            showAuthScreen();
        }

        // Auth tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
        });

        // Auth actions
        loginBtn.addEventListener('click', handleLogin);
        registerBtn.addEventListener('click', handleRegister);

        // Forgot password
        $('showForgotBtn').addEventListener('click', () => {
            $('loginForm').style.display = 'none';
            $('forgotPanel').style.display = 'flex';
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        });
        $('backToLoginBtn').addEventListener('click', () => {
            $('forgotPanel').style.display = 'none';
            $('loginForm').style.display = 'flex';
            document.querySelector('.auth-tab[data-tab="login"]').classList.add('active');
        });
        $('sendResetBtn').addEventListener('click', handleForgotPassword);
        $('forgotEmail').addEventListener('keypress', e => { if (e.key === 'Enter') handleForgotPassword(); });

        // Allow Enter key on password fields
        $('loginPassword').addEventListener('keypress', e => { if (e.key === 'Enter') handleLogin(); });
        $('regPassword2').addEventListener('keypress', e => { if (e.key === 'Enter') handleRegister(); });

        // Main app actions
        saveBtn.addEventListener('click', handleSaveNote);
        searchInput.addEventListener('input', e => { searchQuery = e.target.value.toLowerCase(); renderNotes(); });
        categoryFilterEl.addEventListener('change', e => { categoryFilter = e.target.value; renderNotes(); });
        exportBtn.addEventListener('click', exportVault);
        importBtn.addEventListener('click', importVault);
        clearAllBtn.addEventListener('click', handleClearAll);
        lockBtn.addEventListener('click', () => logoutModal.style.display = 'flex');
        confirmLogoutBtn.addEventListener('click', () => {
            logoutModal.style.display = 'none';
            handleLogout();
        });
        cancelLogoutBtn.addEventListener('click', () => logoutModal.style.display = 'none');
        settingsBtn.addEventListener('click', () => settingsModal.style.display = 'flex');
        passwordInput.addEventListener('input', updatePasswordStrength);
        $('regPassword').addEventListener('input', updateRegPasswordStrength);

        // Password visibility toggles
        if ($('toggleLoginPassword')) $('toggleLoginPassword').addEventListener('click', () => togglePasswordVisibility('loginPassword', 'toggleLoginPassword'));
        if ($('toggleRegPassword')) $('toggleRegPassword').addEventListener('click', () => togglePasswordVisibility('regPassword', 'toggleRegPassword'));
        if ($('toggleRegPassword2')) $('toggleRegPassword2').addEventListener('click', () => togglePasswordVisibility('regPassword2', 'toggleRegPassword2'));
        if ($('togglePasswordInput')) $('togglePasswordInput').addEventListener('click', () => togglePasswordVisibility('passwordInput', 'togglePasswordInput'));

        // Close modals
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                settingsModal.style.display = 'none';
                logoutModal.style.display = 'none';
            });
        });

        window.addEventListener('click', e => {
            if (e.target === settingsModal) settingsModal.style.display = 'none';
            if (e.target === logoutModal) logoutModal.style.display = 'none';
        });

        // Settings changes
        $('timeoutSelect').addEventListener('change', e => {
            timeoutMinutes = parseInt(e.target.value);
            localStorage.setItem('vault_timeout', timeoutMinutes);
            restartSessionTimer();
        });

        $('themeSelect').addEventListener('change', e => {
            document.body.classList.toggle('light-mode', e.target.value === 'light');
            localStorage.setItem('vault_theme', e.target.value);
        });

        // Load saved settings
        const savedTimeout = localStorage.getItem('vault_timeout');
        if (savedTimeout) timeoutMinutes = parseInt(savedTimeout);
        const savedTheme = localStorage.getItem('vault_theme');
        if (savedTheme === 'light') document.body.classList.add('light-mode');
    }

    // ══════════════════════════════════════════════════════════════
    //  AUTH SCREEN HELPERS
    // ══════════════════════════════════════════════════════════════
    function showAuthScreen() {
        authScreen.style.display = 'flex';
        mainApp.style.display = 'none';
        // Always clear login fields — never leak previous credentials
        $('loginEmail').value = '';
        $('loginPassword').value = '';
        hideError(loginError);
    }

    function showMainApp(user) {
        currentUser = user;
        authScreen.style.display = 'none';
        mainApp.style.display = 'block';
        userGreeting.textContent = `${user.name}'s Vault`;
        startSessionTimer();
        fetchNotes();
    }

    function switchAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        loginForm.style.display = tab === 'login' ? 'flex' : 'none';
        registerForm.style.display = tab === 'register' ? 'flex' : 'none';
        $('forgotPanel').style.display = 'none';   // always hide the forgot panel on tab switch
        hideError(loginError);
        hideError(registerError);
    }

    function showError(el, msg) { el.textContent = msg; el.style.display = 'block'; }
    function hideError(el) { el.style.display = 'none'; }

    // ══════════════════════════════════════════════════════════════
    //  API HELPER — wraps fetch with auth token and error handling
    // ══════════════════════════════════════════════════════════════
    async function api(method, endpoint, body = null) {
        const token = sessionStorage.getItem(TOKEN_KEY);
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            // If Unauthenticated, clear session and force login
            if (response.status === 401) {
                sessionStorage.removeItem(TOKEN_KEY);
                showAuthScreen();
                throw new Error('Session expired. Please log in again.');
            }

            // Laravel returns validation errors as { errors: { field: ['message'] } }
            // or simple { message: '...' }
            const errMsg = data.message ||
                Object.values(data.errors || {}).flat().join(' ') ||
                'Request failed';
            throw new Error(errMsg);
        }

        return data;
    }

    // ══════════════════════════════════════════════════════════════
    //  AUTHENTICATION
    // ══════════════════════════════════════════════════════════════
    async function verifyToken(token) {
        try {
            const user = await api('GET', '/user');
            showMainApp(user);
        } catch {
            // Token expired or invalid — show login
            sessionStorage.removeItem(TOKEN_KEY);
            showAuthScreen();
        }
    }

    async function handleLogin() {
        hideError(loginError);
        const email = $('loginEmail').value.trim();
        const password = $('loginPassword').value;

        if (!email || !password) {
            showError(loginError, 'Please enter your email and password.');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="spinner"></span> Unlocking...';

        try {
            const data = await api('POST', '/login', { email, password });
            sessionStorage.setItem(TOKEN_KEY, data.token);
            showMainApp(data.user);
            showToast('Vault unlocked successfully', 'success');
        } catch (err) {
            // Always show a neutral message — never expose backend internals
            showError(loginError, '⚠ Invalid email or password. Please try again.');
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '🔓 Unlock Vault';
        }
    }

    async function handleRegister() {
        hideError(registerError);
        const name = $('regName').value.trim();
        const email = $('regEmail').value.trim();
        const password = $('regPassword').value;
        const password2 = $('regPassword2').value;

        if (!name || !email || !password) {
            showError(registerError, 'All fields are required.');
            return;
        }
        if (password !== password2) {
            showError(registerError, 'Passwords do not match.');
            return;
        }
        if (password.length < 8) {
            showError(registerError, 'Password must be at least 8 characters.');
            return;
        }
        if (calculatePasswordScore(password) < 4) {
            showError(registerError, 'Please use a stronger password (mix uppercase, numbers, and symbols).');
            return;
        }

        registerBtn.disabled = true;
        registerBtn.innerHTML = '<span class="spinner"></span> Creating vault...';

        try {
            const data = await api('POST', '/register', {
                name,
                email,
                password,
                password_confirmation: password2,
            });
            showToast('Vault created successfully! Please log in.', 'success');

            // Switch to login tab — leave fields blank so user types credentials manually
            switchAuthTab('login');

            // Clear register form
            $('regName').value = '';
            $('regEmail').value = '';
            $('regPassword').value = '';
            $('regPassword2').value = '';
            $('regStrengthBar').style.width = '0%';
            $('regStrengthText').textContent = '';
        } catch (err) {
            showError(registerError, err.message);
        } finally {
            registerBtn.disabled = false;
            registerBtn.innerHTML = '🔐 Create Vault';
        }
    }

    async function handleForgotPassword() {
        const msgEl = $('forgotMsg');
        const email = $('forgotEmail').value.trim();
        const sendBtn = $('sendResetBtn');

        msgEl.style.display = 'none';

        if (!email) {
            msgEl.style.display = 'block';
            msgEl.style.color = '#f87171';
            msgEl.textContent = 'Please enter your email address.';
            return;
        }

        sendBtn.disabled = true;
        sendBtn.innerHTML = '<span class="spinner"></span> Sending...';

        try {
            const data = await api('POST', '/forgot-password', { email });
            msgEl.style.display = 'block';
            msgEl.style.color = '#4ade80';
            msgEl.textContent = '✅ ' + data.message;
            sendBtn.innerHTML = '<i class="fas fa-check"></i> Sent!';
        } catch (err) {
            msgEl.style.display = 'block';
            msgEl.style.color = '#f87171';
            msgEl.textContent = err.message;
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reset Link';
        }
    }

    async function handleLogout() {
        try {
            await api('POST', '/logout');
        } catch { /* ignore */ }

        sessionStorage.removeItem(TOKEN_KEY);
        notes = [];
        currentUser = null;
        if (sessionTimer) clearInterval(sessionTimer);
        showAuthScreen();
        showToast('Vault locked', 'info');
    }

    // ══════════════════════════════════════════════════════════════
    //  ENCRYPTION (all happens in browser — server never sees plaintext)
    // ══════════════════════════════════════════════════════════════
    function generateSalt() {
        return CryptoJS.enc.Base64.stringify(CryptoJS.lib.WordArray.random(SALT_LENGTH));
    }

    function generateIV() {
        return CryptoJS.enc.Base64.stringify(CryptoJS.lib.WordArray.random(IV_LENGTH));
    }

    function deriveKey(password, saltBase64) {
        const salt = CryptoJS.enc.Base64.parse(saltBase64);
        return CryptoJS.PBKDF2(password, salt, {
            keySize: KEY_SIZE,
            iterations: PBKDF2_ITERATIONS,
            hasher: CryptoJS.algo.SHA256,
        });
    }

    function encryptNote(plaintext, password) {
        if (!plaintext || !password) throw new Error('Missing required fields');
        const salt = generateSalt();
        const iv = generateIV();
        const key = deriveKey(password, salt);
        const ivWordArray = CryptoJS.enc.Base64.parse(iv);
        const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
            iv: ivWordArray,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });
        const ciphertext = encrypted.toString();

        // Integrity hash: SHA-256 of ciphertext (tamper detection)
        const integrityHash = CryptoJS.SHA256(ciphertext).toString();

        return { ciphertext, iv, salt, integrity_hash: integrityHash };
    }

    function decryptNote(ciphertext, iv, salt, password) {
        const key = deriveKey(password, salt);
        const ivWordArray = CryptoJS.enc.Base64.parse(iv);
        const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
            iv: ivWordArray,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });
        const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
        if (!plaintext) throw new Error('Wrong password or corrupted data');
        return plaintext;
    }

    // ══════════════════════════════════════════════════════════════
    //  NOTES — CRUD
    // ══════════════════════════════════════════════════════════════
    async function fetchNotes() {
        notesList.innerHTML = `
            <div class="empty-state">
                <span class="spinner" style="width:32px;height:32px;border-width:3px;"></span>
                <p>Loading your encrypted vault...</p>
            </div>`;
        try {
            notes = await api('GET', '/notes');
            renderNotes();
        } catch (err) {
            showToast('Failed to load notes: ' + err.message, 'error');
            notesList.innerHTML = '<div class="empty-state"><p>Failed to load notes.</p></div>';
        }
    }

    async function handleSaveNote() {
        const text = noteInput.value.trim();
        const password = passwordInput.value;
        const category = $('noteCategory').value;

        if (!text) { showToast('Please write a note first', 'warning'); return; }
        if (!password) { showToast('Enter an encryption password', 'warning'); return; }

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner"></span> Encrypting...';

        try {
            // 1. Encrypt in browser
            const encrypted = encryptNote(text, password);

            // 2. Send ONLY ciphertext to server
            const saved = await api('POST', '/notes', {
                category,
                ciphertext: encrypted.ciphertext,
                iv: encrypted.iv,
                salt: encrypted.salt,
                integrity_hash: encrypted.integrity_hash,
            });

            // 3. Add to local list and re-render
            notes.unshift(saved.note);
            renderNotes();

            // 4. Clear inputs
            noteInput.value = '';
            passwordInput.value = '';
            if (strengthBar) { strengthBar.style.width = '0%'; }
            if (strengthText) { strengthText.textContent = ''; }

            showToast('Note encrypted and saved to server', 'success');
        } catch (err) {
            showToast('Failed to save: ' + err.message, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-shield-alt"></i> Encrypt & Save';
        }
    }

    async function handleDeleteNote(id) {
        if (!confirm('⚠️ Permanently delete this encrypted note?')) return;
        try {
            await api('DELETE', `/notes/${id}`);
            notes = notes.filter(n => n.id !== id);
            renderNotes();
            showToast('Note deleted', 'info');
        } catch (err) {
            showToast('Delete failed: ' + err.message, 'error');
        }
    }

    async function handleClearAll() {
        if (!confirm('⚠️ DANGER: Delete ALL notes from the server? This cannot be undone.')) return;
        try {
            await api('DELETE', '/notes');
            notes = [];
            renderNotes();
            showToast('All notes cleared', 'warning');
        } catch (err) {
            showToast('Clear failed: ' + err.message, 'error');
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  RENDER NOTES
    // ══════════════════════════════════════════════════════════════
    function renderNotes() {
        let filtered = notes;

        // Category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(n => n.category === categoryFilter);
        }

        // Search — searches over category and timestamp only (can't search encrypted content)
        if (searchQuery) {
            filtered = filtered.filter(n =>
                n.category.toLowerCase().includes(searchQuery) ||
                new Date(n.created_at).toLocaleString().toLowerCase().includes(searchQuery)
            );
        }

        if (noteCounter) noteCounter.textContent = `${notes.length} note${notes.length !== 1 ? 's' : ''}`;

        if (filtered.length === 0) {
            notesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-lock" style="font-size:48px;"></i>
                    <p>${notes.length === 0 ? 'No secure notes yet. Create your first encrypted entry.' : 'No notes match your filter.'}</p>
                </div>`;
            return;
        }

        const categoryIcons = {
            Personal: '📔', Work: '💼', Financial: '💰', Credentials: '🔑', Other: '📁'
        };

        notesList.innerHTML = filtered.map(note => {
            // Verify integrity hash on render (tamper detection)
            const computedHash = CryptoJS.SHA256(note.ciphertext).toString();
            const tampered = computedHash !== note.integrity_hash;

            return `
            <div class="note-card" id="card-${note.id}">
                <div class="note-header">
                    <div class="note-meta">
                        <span class="note-category">
                            ${categoryIcons[note.category] || '📁'} ${escapeHtml(note.category)}
                        </span>
                        <span class="note-timestamp">
                            ${new Date(note.created_at).toLocaleString()}
                        </span>
                        ${tampered ? '<span class="tamper-warning">⚠️ INTEGRITY CHECK FAILED</span>' : ''}
                    </div>
                    <div class="note-actions">
                        <button class="decrypt-btn" data-id="${note.id}">
                            <i class="fas fa-unlock-alt"></i> Decrypt
                        </button>
                        <button class="delete-btn" data-id="${note.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="note-content" id="noteContent-${note.id}">
                    ${escapeHtml(note.ciphertext.substring(0, 60))}…
                </div>
            </div>`;
        }).join('');

        // Attach listeners after rendering
        document.querySelectorAll('.decrypt-btn').forEach(btn => {
            btn.addEventListener('click', () => handleDecryptNote(btn.dataset.id));
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => handleDeleteNote(parseInt(btn.dataset.id)));
        });
    }

    function handleDecryptNote(noteId) {
        const note = notes.find(n => n.id == noteId);
        if (!note) return;

        const contentDiv = document.getElementById(`noteContent-${noteId}`);
        const actionDiv = document.querySelector(`#card-${noteId} .note-actions`);
        const decryptBtn = actionDiv ? actionDiv.querySelector('.decrypt-btn') : null;

        if (decryptBtn) decryptBtn.style.display = 'none';

        contentDiv.innerHTML = `
            <div class="decrypt-form">
                <div class="password-wrapper">
                    <input type="password" id="pass-${noteId}" placeholder="Encryption key..." class="decrypt-input">
                    <i class="fas fa-eye-slash toggle-password" id="toggle-${noteId}" title="Toggle password visibility"></i>
                </div>
                <div class="decrypt-form-actions">
                    <button class="btn-primary btn-sm" onclick="submitDecryption('${noteId}')">
                        <i class="fas fa-unlock"></i> Unlock
                    </button>
                    <button class="btn-secondary btn-sm" onclick="reEncryptNote('${noteId}')">
                        Cancel
                    </button>
                </div>
            </div>`;

        const input = $(`pass-${noteId}`);
        const toggle = $(`toggle-${noteId}`);

        if (toggle) {
            toggle.addEventListener('click', () => togglePasswordVisibility(`pass-${noteId}`, `toggle-${noteId}`));
        }

        if (input) {
            input.focus();
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') submitDecryption(noteId);
            });
        }
    }

    window.submitDecryption = function (noteId) {
        const input = document.getElementById(`pass-${noteId}`);
        const password = input ? input.value : '';
        if (!password) {
            showToast('Please enter the decryption key', 'warning');
            return;
        }
        performDecryption(noteId, password);
    };

    function performDecryption(noteId, password) {
        const note = notes.find(n => n.id == noteId);
        if (!note) return;

        const contentDiv = document.getElementById(`noteContent-${noteId}`);
        const actionDiv = document.querySelector(`#card-${noteId} .note-actions`);
        const decryptBtn = actionDiv ? actionDiv.querySelector('.decrypt-btn') : null;

        const originalHTML = `${escapeHtml(note.ciphertext.substring(0, 60))}…`;
        contentDiv.innerHTML = '<span class="spinner"></span> Decrypting...';

        // Small timeout to let UI update before CPU-heavy PBKDF2
        setTimeout(() => {
            try {
                const plaintext = decryptNote(note.ciphertext, note.iv, note.salt, password);
                contentDiv.className = 'note-content decrypted';
                contentDiv.innerHTML = `
                    <div class="decrypted-content">
                        <div class="plaintext-body">${escapeHtml(plaintext)}</div>
                        <div class="decrypted-actions">
                            <button class="copy-btn" onclick="copyToClipboard('${escapeHtml(plaintext).replace(/'/g, '\\\'').replace(/\n/g, '\\n')}')">
                                <i class="fas fa-copy"></i> Copy Note
                            </button>
                            <button class="relock-btn" onclick="reEncryptNote('${noteId}')">
                                <i class="fas fa-lock"></i> Re-lock
                            </button>
                        </div>
                    </div>`;
                showToast('Note decrypted', 'success');
            } catch {
                contentDiv.className = 'note-content';
                contentDiv.innerHTML = originalHTML;
                if (decryptBtn) decryptBtn.style.display = 'inline-block';
                showToast('Wrong password or corrupted note', 'error');
            }
        }, 50);
    }

    // ══════════════════════════════════════════════════════════════
    //  EXPORT / IMPORT (local backup of encrypted data)
    // ══════════════════════════════════════════════════════════════
    function exportVault() {
        const blob = new Blob([JSON.stringify({ version: '2.0', exportDate: new Date().toISOString(), notes }, null, 2)],
            { type: 'application/json' });
        const a = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(blob),
            download: `vault_backup_${Date.now()}.json`,
        });
        a.click();
        URL.revokeObjectURL(a.href);
        showToast('Vault exported', 'success');
    }

    function importVault() {
        const input = Object.assign(document.createElement('input'), { type: 'file', accept: '.json' });
        input.onchange = async e => {
            try {
                const text = await e.target.files[0].text();
                const imported = JSON.parse(text);
                if (!Array.isArray(imported.notes)) throw new Error('Invalid format');

                // Re-upload each imported note to the server
                let count = 0;
                for (const n of imported.notes) {
                    await api('POST', '/notes', {
                        category: n.category || 'Other',
                        ciphertext: n.ciphertext,
                        iv: n.iv,
                        salt: n.salt,
                        integrity_hash: n.integrity_hash || CryptoJS.SHA256(n.ciphertext).toString(),
                    });
                    count++;
                }

                await fetchNotes(); // Refresh from server
                showToast(`Imported ${count} notes`, 'success');
            } catch (err) {
                showToast('Import failed: ' + err.message, 'error');
            }
        };
        input.click();
    }

    // ══════════════════════════════════════════════════════════════
    //  SESSION TIMER
    // ══════════════════════════════════════════════════════════════
    function startSessionTimer() {
        if (sessionTimer) clearInterval(sessionTimer);
        let timeLeft = timeoutMinutes * 60;
        updateTimerDisplay(timeLeft);

        sessionTimer = setInterval(() => {
            timeLeft--;
            updateTimerDisplay(timeLeft);
            if (timeLeft <= 0) {
                clearInterval(sessionTimer);
                showToast('Session timed out — vault locked for security', 'warning');
                handleLogout();
            }
        }, 1000);

        // Reset timer on user activity
        ['click', 'keypress', 'mousemove'].forEach(event => {
            document.addEventListener(event, () => { timeLeft = timeoutMinutes * 60; }, { passive: true });
        });
    }

    function restartSessionTimer() {
        if (sessionTimer) clearInterval(sessionTimer);
        startSessionTimer();
    }

    function updateTimerDisplay(seconds) {
        if (!timerDisplay) return;
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${m}:${s}`;
    }

    // ══════════════════════════════════════════════════════════════
    //  UTILITIES
    // ══════════════════════════════════════════════════════════════
    function calculatePasswordScore(pw) {
        let score = 0;
        if (pw.length >= 8) score++;
        if (pw.length >= 12) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        return score;
    }

    function updatePasswordUI(pw, barEl, textEl) {
        const score = calculatePasswordScore(pw);
        const pct = Math.min(100, score * 20);
        const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
        const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#4ade80'];

        if (barEl) { barEl.style.width = `${pct}%`; barEl.style.background = colors[score] || '#ef4444'; }
        if (textEl) { textEl.textContent = labels[score] || ''; }
        return score;
    }

    function updatePasswordStrength() {
        updatePasswordUI(passwordInput.value, strengthBar, strengthText);
    }

    function updateRegPasswordStrength() {
        updatePasswordUI($('regPassword').value, $('regStrengthBar'), $('regStrengthText'));
    }

    function togglePasswordVisibility(inputId, iconId) {
        const input = $(inputId);
        const icon = $(iconId);
        if (!input || !icon) return;

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function showToast(message, type = 'info') {
        const existing = document.getElementById('dynamicToast');
        if (existing) existing.remove();

        const colors = { success: '#14532dcc', error: '#7f1d1dcc', warning: '#713f12cc', info: '#1e3a8acc' };
        const icons = { success: 'check-circle', error: 'exclamation-circle', warning: 'exclamation-triangle', info: 'info-circle' };

        const toast = Object.assign(document.createElement('div'), {
            id: 'dynamicToast',
            innerHTML: `<i class="fas fa-${icons[type] || 'info-circle'}"></i> ${escapeHtml(message)}`,
        });

        Object.assign(toast.style, {
            position: 'fixed', bottom: '20px', right: '20px', zIndex: '99999',
            padding: '12px 20px', borderRadius: '12px', fontSize: '0.85rem',
            backdropFilter: 'blur(12px)', transition: 'opacity 0.3s',
            backgroundColor: colors[type] || colors.info,
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            maxWidth: '320px', color: 'white',
        });

        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 350); }, 3000);
    }

    // ══════════════════════════════════════════════════════════════
    //  GLOBAL HELPERS (called from inline HTML)
    // ══════════════════════════════════════════════════════════════
    window.copyToClipboard = function (text) {
        navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard', 'success'));
        // Auto-clear clipboard after 30s
        setTimeout(() => navigator.clipboard.writeText(''), 30000);
    };

    window.reEncryptNote = function (noteId) {
        const contentDiv = document.getElementById(`noteContent-${noteId}`);
        const actionDiv = document.querySelector(`#card-${noteId} .note-actions`);
        const decryptBtn = actionDiv ? actionDiv.querySelector('.decrypt-btn') : null;
        const note = notes.find(n => n.id == noteId);
        if (!contentDiv || !note) return;

        contentDiv.className = 'note-content';
        contentDiv.innerHTML = `${escapeHtml(note.ciphertext.substring(0, 60))}…`;
        if (decryptBtn) decryptBtn.style.display = 'inline-block';
    };

    // ══════════════════════════════════════════════════════════════
    //  START
    // ══════════════════════════════════════════════════════════════
    init();

})();
