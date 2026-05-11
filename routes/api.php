<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\CtfController;
use Illuminate\Support\Facades\Route;

// ── PUBLIC ROUTES (no token required) ──────────────────────────
Route::post('register',        [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('login',           [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('forgot-password', [PasswordResetController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('reset-password',  [PasswordResetController::class, 'resetPassword'])->middleware('throttle:5,1');

// ── PROTECTED ROUTES (Bearer token required) ───────────────────
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('user',    [AuthController::class, 'me']);

    // Notes
    Route::get('notes',          [NoteController::class, 'index']);
    Route::post('notes',         [NoteController::class, 'store']);
    Route::delete('notes/{id}',  [NoteController::class, 'destroy']);
    Route::delete('notes',       [NoteController::class, 'destroyAll']);

    // ── CTF ROUTES ────────────────────────────────────────────────
    Route::get('/ctf/challenges', [CtfController::class, 'index']);
    Route::post('/ctf/submit', [CtfController::class, 'submit']);
    Route::post('/ctf/hint', [CtfController::class, 'hint']);
    Route::get('/ctf/scoreboard', [CtfController::class, 'scoreboard']);
    Route::get('/ctf/stats', [CtfController::class, 'stats']);
    Route::get('/ctf/transmission', [CtfController::class, 'getTransmission']);

    // Admin routes (only user ID 1 can access)
    Route::get('ctf/admin/challenges',         [CtfController::class, 'adminList']);
    Route::post('ctf/admin/challenges',        [CtfController::class, 'adminCreate']);
    Route::put('ctf/admin/challenges/{id}',    [CtfController::class, 'adminUpdate']);
    Route::delete('ctf/admin/challenges/{id}', [CtfController::class, 'adminDelete']);
});
