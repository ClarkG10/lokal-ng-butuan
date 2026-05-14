<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Masterlist;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PublicLoginController extends Controller
{
    /**
     * Public member login.
     *
     * Request body:
     *   initials  – uppercase initials, e.g. "JPG"  (first letter of each name part)
     *   birthdate – birthday in YYYY-MM-DD format  (from the date picker)
     *
     * Looks up all members whose birthdate matches, then confirms the initials.
     * Login code displayed to the user = INITIALS + MMDDYY(birthdate).
     */
    public function login(Request $request)
    {
        $request->validate([
            'initials' => 'required|string|min:2|max:6',
            'birthdate' => 'required|date',
        ]);

        $initials = strtoupper(trim($request->input('initials')));
        $birthdate = Carbon::parse($request->input('birthdate'))->toDateString(); // YYYY-MM-DD

        // Find members with matching birthdate
        $candidates = Masterlist::whereDate('birthdate', $birthdate)->get();

        $member = $candidates->first(function ($m) use ($initials) {
            $parts    = array_filter(explode(' ', trim("{$m->first_name} {$m->middle_name} {$m->last_name}")));
            $computed = implode('', array_map(fn($p) => strtoupper($p[0]), $parts));
            return $computed === $initials;
        });

        if (! $member) {
            return response()->json([
                'message' => 'Member not found. Please check your initials and birthday.',
            ], 404);
        }

        // Build MMDDYY code suffix from the stored birthdate
        $codeSuffix = Carbon::parse($birthdate)->format('mdY');   // e.g. 05212002
        $codeSuffix = substr($codeSuffix, 0, 2)                   // MM
                    . substr($codeSuffix, 2, 2)                   // DD
                    . substr(Carbon::parse($birthdate)->format('y'), 0, 2); // YY
        $loginCode = $initials . Carbon::parse($birthdate)->format('mdy'); // MMDDYY

        return response()->json([
            'data' => [
                'id'          => $member->id,
                'first_name'  => $member->first_name,
                'middle_name' => $member->middle_name,
                'last_name'   => $member->last_name,
                'full_name'   => $member->full_name,
                'belongs_to'  => $member->belongs_to,
                'purok'       => $member->purok,
                'email'       => $member->email,
                'phone'       => $member->phone,
                'login_code'  => $loginCode,
            ],
        ]);
    }
}
