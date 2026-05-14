<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index()
    {
        $users = User::orderBy('name')->get()->map(fn ($u) => [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'roles' => $u->getRoleNames(),
            'created_at' => $u->created_at?->toIso8601String(),
        ]);

        return response()->json(['data' => $users]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'in:super_admin,content_manager,moderator,analytics_viewer'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);
        $user->assignRole($data['role']);

        return response()->json(['data' => $user], 201);
    }

    public function setRole(Request $request, User $user)
    {
        $data = $request->validate([
            'role' => ['required', 'in:super_admin,content_manager,moderator,analytics_viewer'],
        ]);

        $user->syncRoles([$data['role']]);

        return response()->json(['data' => ['roles' => $user->getRoleNames()]]);
    }

    public function destroy(User $user)
    {
        abort_if($user->hasRole('super_admin') && User::role('super_admin')->count() <= 1,
            422, 'Cannot remove the last super admin.');

        $user->delete();

        return response()->noContent();
    }
}
