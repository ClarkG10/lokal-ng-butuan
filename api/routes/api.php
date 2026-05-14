<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\EventController;
use App\Http\Controllers\Api\V1\SurveyController;
use App\Http\Controllers\Api\V1\SurveyResponseController;
use App\Http\Controllers\Api\V1\AnnouncementController;
use App\Http\Controllers\Api\V1\CommentController;
use App\Http\Controllers\Api\V1\ReactionController;
use App\Http\Controllers\Api\V1\Admin\MasterlistController;
use App\Http\Controllers\Api\V1\Admin\AnalyticsController;
use App\Http\Controllers\Api\V1\Admin\EventMediaController;
use App\Http\Controllers\Api\V1\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\V1\Admin\GalleryController as AdminGalleryController;
use App\Http\Controllers\Api\V1\GalleryController;

Route::prefix('v1')->group(function () {

    /* ---------- Auth (token-based, stateless) ---------- */
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        Route::put('me', [AuthController::class, 'updateProfile']);
        Route::put('me/password', [AuthController::class, 'updatePassword']);
    });

    /* ---------- Public ---------- */
    Route::get('events', [EventController::class, 'index']);
    Route::get('events/{event:slug}', [EventController::class, 'show']);

    Route::get('surveys', [SurveyController::class, 'index']);
    Route::get('surveys/{survey:slug}', [SurveyController::class, 'show']);
    Route::post('surveys/{survey}/responses', [SurveyResponseController::class, 'store'])
        ->middleware('throttle:30,1');

    Route::get('announcements', [AnnouncementController::class, 'index']);
    Route::get('announcements/{announcement:slug}', [AnnouncementController::class, 'show'])->name('announcements.show');

    Route::get('gallery', [GalleryController::class, 'index']);

    Route::get('masterlists/search', [MasterlistController::class, 'search'])->middleware('throttle:30,1');

    Route::get('comments', [CommentController::class, 'index']);
    Route::post('comments', [CommentController::class, 'store'])->middleware('throttle:20,1');
    Route::post('comments/{comment}/react', [ReactionController::class, 'toggle'])->middleware('throttle:60,1');

    /* ---------- Admin (auth + role-gated) ---------- */
    Route::middleware('auth:sanctum')->prefix('admin')->group(function () {

        Route::middleware('role:super_admin|content_manager')->group(function () {
            Route::get('events', [EventController::class, 'index']);
            Route::get('events/{event}', [EventController::class, 'adminShow']);
            Route::post('events', [EventController::class, 'store']);
            Route::patch('events/{event}', [EventController::class, 'update']);
            Route::delete('events/{event}', [EventController::class, 'destroy']);

            Route::post('events/{event}/media', [EventMediaController::class, 'store']);
            Route::patch('events/{event}/media/reorder', [EventMediaController::class, 'reorder']);
            Route::delete('events/{event}/media/{media}', [EventMediaController::class, 'destroy']);

            Route::get('surveys', [SurveyController::class, 'index']);
            Route::get('surveys/{survey}', [SurveyController::class, 'show']);
            Route::post('surveys', [SurveyController::class, 'store']);
            Route::patch('surveys/{survey}', [SurveyController::class, 'update']);
            Route::delete('surveys/{survey}', [SurveyController::class, 'destroy']);
            Route::get('surveys/{survey}/responses', [SurveyResponseController::class, 'index']);

            Route::apiResource('announcements', AnnouncementController::class)->except(['index', 'show']);
            Route::get('announcements/{announcement}', [AnnouncementController::class, 'show'])->name('admin.announcements.show');

            Route::get('gallery', [AdminGalleryController::class, 'index']);
            Route::post('gallery', [AdminGalleryController::class, 'store']);
            Route::patch('gallery/{item}', [AdminGalleryController::class, 'update']);
            Route::delete('gallery/{item}', [AdminGalleryController::class, 'destroy']);
            Route::patch('gallery-reorder', [AdminGalleryController::class, 'reorder']);
        });

        Route::middleware('role:super_admin|content_manager|moderator')->group(function () {
            Route::get('comments', [CommentController::class, 'index']);
            Route::patch('comments/{comment}/moderate', [CommentController::class, 'moderate']);
        });

        Route::middleware('role:super_admin|content_manager|analytics_viewer')->group(function () {
            Route::get('masterlists', [MasterlistController::class, 'index']);
            Route::get('masterlists/export', [MasterlistController::class, 'export']);
        });

        Route::middleware('role:super_admin|content_manager|moderator|analytics_viewer')->group(function () {
            Route::get('analytics/overview', [AnalyticsController::class, 'overview']);
            Route::get('analytics/series', [AnalyticsController::class, 'series']);
        });

        Route::middleware('role:super_admin')->group(function () {
            Route::get('users', [AdminUserController::class, 'index']);
            Route::post('users', [AdminUserController::class, 'store']);
            Route::patch('users/{user}/role', [AdminUserController::class, 'setRole']);
            Route::delete('users/{user}', [AdminUserController::class, 'destroy']);
        });
    });
});
