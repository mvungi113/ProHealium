<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use LogsActivity;

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->status !== 'Active') {
            throw ValidationException::withMessages([
                'email' => ['Your account is inactive.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        $this->logActivity('login', "User logged in: {$user->name}", $user);

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        $userName = $user->name;
        $request->user()->currentAccessToken()->delete();

        $this->logActivity('logout', "User logged out: {$userName}");

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        return response()->json($request->user());
    }

    public function seedDefaultUser()
    {
        $user = User::firstOrCreate(
            ['email' => 'admin@prohealium.com'],
            [
                'name' => 'Dr. Emmanuel Amexo',
                'password' => Hash::make('password'),
                'role' => 'Admin',
                'status' => 'Active',
            ]
        );

        return response()->json(['message' => 'Default user created', 'user' => $user]);
    }
}
