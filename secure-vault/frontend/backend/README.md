# 🔐 Secure Notes Vault — Laravel Backend
## Exact Setup Instructions (Beginner Friendly)

---

## BEFORE YOU START — Make sure you have:
- ✅ XAMPP installed → https://www.apachefriends.org
- ✅ Composer installed → https://getcomposer.org/Composer-Setup.exe
- ✅ VS Code with Live Server extension
- ✅ PHP added to PATH (the Composer installer does this automatically)

**After installing anything — always restart VS Code completely.**

---

## FOLDER STRUCTURE YOU SHOULD HAVE:

```
your-project-folder/
├── frontend/
│   ├── 1_notes.html
│   ├── 2_notes.css
│   └── 3_notes.js
├── backend-files/          ← from this zip
│   ├── AuthController.php
│   ├── NoteController.php
│   ├── Note.php
│   ├── 2024_01_01_000000_create_notes_table.php
│   ├── api.php
│   └── cors.php
└── install.ps1             ← from this zip
```

---

## STEP 1 — Start XAMPP

Open XAMPP Control Panel → click **Start** next to:
- **Apache**
- **MySQL**

Both should turn green.

---

## STEP 2 — Create the database

Go to → http://localhost/phpmyadmin
- Click **"New"** on the left sidebar
- Database name: `secure_vault`
- Click **"Create"**

---

## STEP 3 — Open PowerShell in your project folder

In VS Code → open your project folder → press **Ctrl+`** to open terminal.

Make sure you are in the folder that contains `install.ps1`:
```powershell
ls   ← you should see install.ps1 listed here
```

---

## STEP 4 — Run the install script

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install.ps1
```

This will automatically:
1. Create a fresh Laravel project
2. Copy all backend files into it
3. Install Sanctum
4. Configure the database
5. Run migrations (creates tables)
6. Start the server at http://127.0.0.1:8000

---

## STEP 5 — Open the frontend

In VS Code, right-click `frontend/1_notes.html` → **Open with Live Server**

Your browser opens at `http://127.0.0.1:5500/1_notes.html`

---

## STEP 6 — Test

1. Click **Register** tab → fill name, email, password → Create Vault
2. You should enter the main vault
3. Write a note → enter encryption password → Encrypt & Save
4. Check phpMyAdmin → secure_vault → notes table → you see ciphertext (not your text!)
5. Click Decrypt on a note → enter same password → see your note
6. Click lock icon → goes back to login

---

## IF SOMETHING GOES WRONG:

**"php is not recognized"**
→ Restart VS Code after installing Composer. Composer installs PHP path automatically.

**"composer is not recognized"**  
→ Download from https://getcomposer.org/Composer-Setup.exe and restart VS Code.

**Migration fails**
→ Make sure MySQL is Started in XAMPP
→ Make sure you created the `secure_vault` database in phpMyAdmin

**"Failed to fetch" in browser**
→ Make sure `php artisan serve` is still running in terminal
→ Check `3_notes.js` line 18: `const API_BASE = 'http://localhost:8000/api'`

**CORS error in browser console**  
→ Run: `php artisan config:clear` then restart `php artisan serve`

---

## API ENDPOINTS (for your report):

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | /api/register | No | Create account |
| POST | /api/login | No | Login, receive token |
| POST | /api/logout | Yes | Revoke token |
| GET | /api/user | Yes | Get current user |
| GET | /api/notes | Yes | List all encrypted notes |
| POST | /api/notes | Yes | Save encrypted note |
| DELETE | /api/notes/{id} | Yes | Delete one note |
| DELETE | /api/notes | Yes | Delete all notes |

---

## SECURITY FEATURES (for your report):

| Feature | Implementation |
|---------|---------------|
| Zero-knowledge backend | Server stores only ciphertext, never plaintext |
| AES-256-CBC encryption | CryptoJS in browser, unique IV per note |
| PBKDF2 key derivation | 310,000 iterations, SHA-256, unique salt per note |
| Tamper detection | SHA-256 integrity hash verified on every render |
| API authentication | Laravel Sanctum Bearer tokens |
| Brute-force protection | Login rate limited to 5 attempts/minute |
| IDOR prevention | Server checks note ownership before delete |
| XSS prevention | All output HTML-escaped before DOM insertion |
| Session timeout | Auto-locks after inactivity |
