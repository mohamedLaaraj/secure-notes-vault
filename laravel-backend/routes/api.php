<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\PasswordResetController;
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
});
