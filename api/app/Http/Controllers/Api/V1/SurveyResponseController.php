<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Jobs\IngestSurveyResponse;
use App\Models\Survey;
use App\Models\SurveyAnswer;
use App\Models\SurveyResponse;
use Illuminate\Http\Request;

class SurveyResponseController extends Controller
{
    public function index(Survey $survey)
    {
        $responses = $survey->responses()
            ->with(['masterlist', 'answers.question'])
            ->orderByDesc('submitted_at')
            ->get()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'submitted_at' => optional($r->submitted_at)->toIso8601String(),
                    'via_qr' => (bool) $r->via_qr,
                    'user_agent' => $r->user_agent,
                    'latitude' => $r->latitude,
                    'longitude' => $r->longitude,
                    'location_name' => $r->location_name,
                    'respondent' => $r->masterlist ? [
                        'first_name' => $r->masterlist->first_name,
                        'middle_name' => $r->masterlist->middle_name ?? null,
                        'last_name' => $r->masterlist->last_name,
                        'belongs_to' => $r->masterlist->belongs_to ?? null,
                        'purok' => $r->masterlist->purok ?? null,
                        'email' => $r->masterlist->email ?? null,
                        'phone' => $r->masterlist->phone ?? null,
                    ] : null,
                    'answers' => $r->answers->map(fn ($a) => [
                        'question_id' => $a->question_id,
                        'question_label' => $a->question?->label ?? "Question #{$a->question_id}",
                        'question_type' => $a->question?->type ?? 'text',
                        'value' => $a->value,
                    ]),
                ];
            });

        return response()->json(['data' => $responses]);
    }

    public function store(Request $request, Survey $survey)
    {
        abort_unless($survey->status === 'active', 403, 'Survey is not active.');

        $data = $request->validate([
            'answers' => ['required', 'array', 'min:1'],
            // Mandatory respondent identity for every survey submission.
            'respondent' => ['required', 'array'],
            'respondent.first_name' => ['required', 'string', 'max:120'],
            'respondent.middle_name' => ['nullable', 'string', 'max:120'],
            'respondent.last_name' => ['required', 'string', 'max:120'],
            'respondent.belongs_to' => ['required', 'in:Binhi,Kadiwa,Buklod'],
            'respondent.purok' => ['required', 'string', 'max:120'],
            'respondent.email' => ['nullable', 'email', 'max:255'],
            'respondent.phone' => ['nullable', 'string', 'max:32'],
            'via_qr' => ['nullable', 'boolean'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'location_name' => ['nullable', 'string', 'max:255'],
        ]);

        $response = SurveyResponse::create([
            'survey_id' => $survey->id,
            'submitted_at' => now(),
            'ip_hash' => hash('sha256', $request->ip() . config('app.key')),
            'user_agent' => substr((string) $request->userAgent(), 0, 512),
            'via_qr' => (bool) ($data['via_qr'] ?? false),
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
            'location_name' => $data['location_name'] ?? null,
        ]);

        foreach ($data['answers'] as $questionId => $value) {
            SurveyAnswer::create([
                'response_id' => $response->id,
                'question_id' => (int) $questionId,
                'value' => is_array($value) ? $value : ['v' => $value],
            ]);
        }

        IngestSurveyResponse::dispatch($response->id, $data['respondent'] ?? null);

        return response()->json(['data' => ['id' => $response->id]], 201);
    }
}
