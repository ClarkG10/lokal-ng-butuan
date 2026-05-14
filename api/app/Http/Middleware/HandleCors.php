<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class HandleCors
{
    private const ALLOWED_ORIGINS = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
    ];

    public function handle(Request $request, Closure $next): SymfonyResponse
    {
        $origin = $request->header('Origin');

        // Add CORS headers if origin is allowed
        if (in_array($origin, self::ALLOWED_ORIGINS)) {
            // Handle preflight OPTIONS request
            if ($request->getMethod() === 'OPTIONS') {
                $response = new Response('');
            } else {
                $response = $next($request);
            }

            return $response
                ->header('Access-Control-Allow-Origin', $origin)
                ->header('Access-Control-Allow-Credentials', 'true')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD')
                ->header('Access-Control-Allow-Headers', 'Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-Requested-With, X-CSRF-TOKEN, X-XSRF-TOKEN')
                ->header('Access-Control-Max-Age', '86400');
        }

        return $next($request);
    }
}

