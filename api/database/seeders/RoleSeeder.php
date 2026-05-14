<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    public const ROLES = [
        'super_admin',        // full access
        'content_manager',    // events, surveys, announcements, media
        'moderator',          // comments + analytics view
        'analytics_viewer',   // analytics + masterlist read
    ];

    public function run(): void
    {
        foreach (self::ROLES as $role) {
            Role::findOrCreate($role, 'web');
        }
    }
}
