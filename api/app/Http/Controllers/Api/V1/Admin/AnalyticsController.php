<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Event;
use App\Models\Masterlist;
use App\Models\QrScan;
use App\Models\Survey;
use App\Models\SurveyResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function overview(Request $request)
    {
        $totalScans = QrScan::count();
        $totalResponses = SurveyResponse::count();
        $pendingComments = Comment::where('status', 'pending')->count();
        $approvedComments = Comment::where('status', 'approved')->count();

        // Top surveys by response count
        $topSurveys = Survey::withCount('responses')
            ->orderByDesc('responses_count')
            ->limit(5)
            ->get(['id', 'title', 'slug'])
            ->map(fn ($s) => [
                'id' => $s->id,
                'title' => $s->title,
                'responses' => $s->responses_count,
            ]);

        // Top events by QR scan count (via qr_codes pivot)
        $topEvents = DB::table('events')
            ->leftJoin('qr_codes', fn ($j) => $j->on('qr_codes.target_id', '=', 'events.id')->where('qr_codes.target_type', \App\Models\Event::class))
            ->leftJoin('qr_scans', 'qr_scans.qr_code_id', '=', 'qr_codes.id')
            ->select('events.id', 'events.title', DB::raw('count(qr_scans.id) as scans'))
            ->whereNull('events.deleted_at')
            ->groupBy('events.id', 'events.title')
            ->orderByDesc('scans')
            ->limit(5)
            ->get()
            ->map(fn ($e) => ['id' => $e->id, 'title' => $e->title, 'scans' => (int) $e->scans]);

        return response()->json([
            'data' => [
                'totals' => [
                    'events' => Event::count(),
                    'upcoming_events' => Event::where('status', 'upcoming')->count(),
                    'surveys' => Survey::count(),
                    'survey_responses' => $totalResponses,
                    'comments' => Comment::count(),
                    'pending_comments' => $pendingComments,
                    'approved_comments' => $approvedComments,
                    'qr_scans' => $totalScans,
                    'masterlist' => Masterlist::count(),
                ],
                'conversion' => [
                    'qr_to_submit' => $totalScans > 0 ? round($totalResponses / $totalScans, 4) : 0,
                    'survey_completion' => 1.0,
                ],
                'top_surveys' => $topSurveys,
                'top_events' => $topEvents,
                'recent_activity' => DB::table('analytics_logs')
                    ->orderByDesc('occurred_at')->limit(10)->get(),
            ],
        ]);
    }

    public function series(Request $request)
    {
        $metric = $request->query('metric', 'qr_scans');
        $range = $request->query('range', '30d');
        $eventId = $request->query('event_id');
        $surveyId = $request->query('survey_id');

        $days = match ($range) { '7d' => 7, '90d' => 90, default => 30 };
        $from = Carbon::now()->startOfDay()->subDays($days - 1);

        $rows = match ($metric) {
            'survey_responses' => DB::table('survey_responses')
                ->select(DB::raw('DATE(submitted_at) as date'), DB::raw('count(*) as value'))
                ->where('submitted_at', '>=', $from)
                ->when($surveyId, fn ($q) => $q->where('survey_id', $surveyId))
                ->groupBy('date')->pluck('value', 'date'),
            'comments' => DB::table('comments')
                ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as value'))
                ->where('created_at', '>=', $from)
                ->groupBy('date')->pluck('value', 'date'),
            default => DB::table('qr_scans')
                ->join('qr_codes', 'qr_scans.qr_code_id', '=', 'qr_codes.id')
                ->select(DB::raw('DATE(qr_scans.scanned_at) as date'), DB::raw('count(*) as value'))
                ->where('qr_scans.scanned_at', '>=', $from)
                ->when($eventId, fn ($q) => $q->where('qr_codes.target_type', \App\Models\Event::class)->where('qr_codes.target_id', $eventId))
                ->groupBy('date')->pluck('value', 'date'),
        };

        $series = [];
        for ($i = 0; $i < $days; $i++) {
            $d = $from->copy()->addDays($i)->toDateString();
            $series[] = ['date' => substr($d, 5), 'value' => (int) ($rows[$d] ?? 0)];
        }

        return response()->json(['data' => $series]);
    }
}
