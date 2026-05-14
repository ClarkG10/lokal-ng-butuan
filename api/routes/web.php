<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\QrRedirectController;

Route::get('/q/{token}', QrRedirectController::class)->name('qr.redirect');

Route::get('/', fn () => response()->json([
    'name'   => config('app.name'),
    'status' => 'ok',
    'docs'   => '/api/v1',
]));
