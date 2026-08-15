<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    use LogsActivity;

    public function index(Request $request)
    {
        $query = User::query();

        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($qr) use ($q) {
                $qr->where('name', 'ilike', "%{$q}%")
                    ->orWhere('email', 'ilike', "%{$q}%")
                    ->orWhere('role', 'ilike', "%{$q}%");
            });
        }

        $perPage = $request->get('per_page', 15);
        return response()->json($query->latest()->paginate($perPage));
    }

    public function show(User $user)
    {
        return response()->json($user);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|string|max:255',
            'status' => 'required|in:Active,Inactive',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);

        $this->logActivity('user_created', "Created user: {$user->name} ({$user->role})", $user, null, [
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status,
        ]);

        return response()->json($user, 201);
    }

    public function update(Request $request, User $user)
    {
        $oldValues = $user->only(['name', 'email', 'role', 'status']);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'role' => 'required|string|max:255',
            'status' => 'required|in:Active,Inactive',
            'password' => 'nullable|string|min:6',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        $this->logActivity('user_updated', "Updated user: {$user->name}", $user, $oldValues, $user->only(['name', 'email', 'role', 'status']));

        return response()->json($user);
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete your own account'], 403);
        }

        $name = $user->name;
        $user->delete();

        $this->logActivity('user_deleted', "Deleted user: {$name}");

        return response()->json(['message' => 'User deleted successfully']);
    }
}
