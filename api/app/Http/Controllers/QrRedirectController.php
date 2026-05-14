<?php

namespace App\Http\Controllers;

use App\Models\QrCode;
use App\Models\QrScan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class QrRedirectController extends Controller
{
    public function __invoke(Request $request, string $token): RedirectResponse
    {
        $qr = QrCode::where('token', $token)->firstOrFail();

        // Increment counter & log scan (privacy-preserving IP hash)
        $qr->increment('scan_count');

        QrScan::create([
            'qr_code_id' => $qr->id,
            'scanned_at' => Carbon::now(),
            'ip_hash'    => hash('sha256', ($request->ip() ?? '') . config('app.key')),
            'user_agent' => substr((string) $request->userAgent(), 0, 512),
            'referrer'   => substr((string) $request->headers->get('referer'), 0, 512),
        ]);

        $frontend = rtrim(config('frontend.url', 'http://localhost:5173'), '/');

        $path = match ($qr->target_type) {
            \App\Models\Event::class  => "/events/{$qr->target->slug}?qr=1",
            \App\Models\Survey::class => "/surveys/{$qr->target->slug}?qr=1",
            default => '/',
        };

        return redirect()->away($frontend . $path);
    }
}
