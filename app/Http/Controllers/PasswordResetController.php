<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Notifications\ResetPassword as ResetPasswordNotification;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    /**
     * POST /api/forgot-password
     * Accepts: { email }
     * Sends a reset link to the user's email via Mailtrap.
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // Point the reset link at the static frontend page (not the Laravel backend)
        ResetPasswordNotification::createUrlUsing(function ($notifiable, $token) {
            $frontendUrl = env('FRONTEND_URL', 'http://127.0.0.1:5500');
            return "{$frontendUrl}/reset-password.html?token={$token}&email=" . urlencode($notifiable->getEmailForPasswordReset());
        });

        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'message' => 'Password reset link sent to your email.',
            ]);
        }

        return response()->json([
            'message' => __($status),
        ], 422);
    }

    /**
     * POST /api/reset-password
     * Accepts: { token, email, password, password_confirmation }
     * Updates the user's password.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token'                 => 'required',
            'email'                 => 'required|email',
            'password'              => 'required|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password'       => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Password has been reset successfully. You can now log in.',
            ]);
        }

        return response()->json([
            'message' => __($status),
        ], 422);
    }
}
