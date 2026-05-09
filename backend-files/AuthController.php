<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // POST /api/register
    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('vault-token')->plainTextToken;

        return response()->json([
            'message' => 'Account created successfully',
            'user'    => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email],
            'token'   => $token,
        ], 201);
    }

    // POST /api/login
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        // Revoke old tokens (single session per user)
        $user->tokens()->delete();

        $token = $user->createToken('vault-token')->plainTextToken;

        return response()->json([
            'message' => 'Vault unlocked',
            'user'    => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email],
            'token'   => $token,
        ]);
    }

    // POST /api/logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Vault locked successfully']);
    }

    // GET /api/user
    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}
