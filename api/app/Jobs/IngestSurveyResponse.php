<?php

namespace App\Jobs;

use App\Models\Masterlist;
use App\Models\SurveyResponse;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class IngestSurveyResponse implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $responseId,
        public ?array $respondent = null,
    ) {}

    public function handle(): void
    {
        $response = SurveyResponse::with('survey')->find($this->responseId);
        if (! $response) {
            return;
        }

        $masterlistId = null;
        if ($this->respondent && ! empty($this->respondent['first_name']) && ! empty($this->respondent['last_name'])) {
            $first = trim($this->respondent['first_name']);
            $middle = isset($this->respondent['middle_name']) ? trim($this->respondent['middle_name']) : null;
            $last = trim($this->respondent['last_name']);
            $belongsTo = $this->respondent['belongs_to'] ?? null;
            $email = $this->respondent['email'] ?? null;
            $phone = $this->respondent['phone'] ?? null;

            // Match by email/phone first; otherwise by exact name + affiliation.
            $masterlist = Masterlist::query()
                ->when($email, fn ($q) => $q->orWhere('email', $email))
                ->when($phone, fn ($q) => $q->orWhere('phone', $phone))
                ->orWhere(function ($q) use ($first, $last, $belongsTo) {
                    $q->where('first_name', $first)
                        ->where('last_name', $last)
                        ->where('belongs_to', $belongsTo);
                })
                ->first();

            if (! $masterlist) {
                $masterlist = Masterlist::create([
                    'first_name' => $first,
                    'middle_name' => $middle,
                    'last_name' => $last,
                    'belongs_to' => $belongsTo,
                    'purok' => isset($this->respondent['purok']) ? trim($this->respondent['purok']) : null,
                    'email' => $email,
                    'phone' => $phone,
                    'first_seen_at' => now(),
                    'last_activity_at' => now(),
                    'surveys_count' => 0,
                    'events_count' => 0,
                    'source' => 'survey',
                ]);
            }

            $masterlist->update([
                'last_activity_at' => now(),
                'surveys_count' => $masterlist->surveys_count + 1,
            ]);

            $masterlistId = $masterlist->id;
        }

        $response->update(['masterlist_id' => $masterlistId]);

        DB::table('analytics_logs')->insert([
            'event_type' => 'survey_completed',
            'subject_type' => 'App\\Models\\Survey',
            'subject_id' => $response->survey_id,
            'meta' => json_encode(['response_id' => $response->id, 'via_qr' => $response->via_qr]),
            'occurred_at' => now(),
        ]);
    }
}
