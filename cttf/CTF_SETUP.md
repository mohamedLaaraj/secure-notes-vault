# ⚔️ CipherStrike CTF — Setup Instructions

## FILES TO COPY:

### Frontend (copy to your frontend/ folder):
- `ctf.html`  → frontend/ctf.html
- `ctf.css`   → frontend/ctf.css
- `ctf.js`    → frontend/ctf.js

### Backend (copy to your laravel-backend/ folder):
- `migrations/2024_06_01_000000_create_ctf_tables.php` → database/migrations/
- `Models/CtfChallenge.php`    → app/Models/
- `Models/CtfSolve.php`        → app/Models/
- `Controllers/CtfController.php` → app/Http/Controllers/
- `CtfChallengeSeeder.php`     → database/seeders/

---

## STEP 1 — Copy all files above

---

## STEP 2 — Update routes/api.php

Replace your entire routes/api.php with the content of ctf_routes.php

---

## STEP 3 — Run migrations

```bash
php artisan migrate
```

---

## STEP 4 — Seed the challenges

```bash
php artisan db:seed --class=CtfChallengeSeeder
```

---

## STEP 5 — Add CTF link to your Notes Vault

Open frontend/1_notes.html and find the header buttons section.
Add this button next to the lock button:

```html
<button onclick="window.location.href='ctf.html'" class="icon-btn" title="CTF Challenges">
    <i class="fas fa-crosshairs"></i>
</button>
```

---

## STEP 6 — Push to GitHub and Railway

```bash
git add .
git commit -m "Add CipherStrike CTF platform"
git push
```

Railway auto-deploys. Done!

---

## STEP 7 — Add your own challenges

Go to phpMyAdmin → ctf_challenges table → Insert
OR use the admin API (you must be user ID 1):

POST /api/ctf/admin/challenges
{
  "title": "My Challenge",
  "description": "Find the flag hidden somewhere...",
  "category": "web",
  "difficulty": "easy",
  "points": 100,
  "flag": "FLAG{my_secret_flag}",
  "hint": "Optional hint here"
}

---

## ADMIN PANEL

The first registered user (ID=1) is the admin.
Admin can create/edit/delete challenges via:
- GET    /api/ctf/admin/challenges
- POST   /api/ctf/admin/challenges
- PUT    /api/ctf/admin/challenges/{id}
- DELETE /api/ctf/admin/challenges/{id}

---

## CHANGE CTF END TIME

Open frontend/ctf.js and find line ~52:
```javascript
ctfEndTime = new Date('2026-06-01T23:59:00');
```
Change to your actual competition end date/time.

---

## FLAG FORMAT

All flags must follow: FLAG{something_here}
Examples:
- FLAG{hello_world}
- FLAG{this_is_the_answer}
- FLAG{s3cur3_n0t3s_v4ult}
