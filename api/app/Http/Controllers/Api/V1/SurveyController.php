<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\SurveyResource;
use App\Models\QrCode;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SurveyController extends Controller
{
    public function index(Request $request)
    {
        $surveys = Survey::with(['qrCode', 'questions', 'event'])
            ->when($request->query('status'), fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('id')->get();

        return SurveyResource::collection($surveys);
    }

    public function show(Survey $survey)
    {
        $survey->load(['qrCode', 'questions', 'event']);

        return new SurveyResource($survey);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $survey = DB::transaction(function () use ($data) {
            $payload = collect($data)->except('questions')->toArray();
            $payload['slug'] ??= Str::slug($payload['title']) . '-' . Str::random(5);
            $survey = Survey::create($payload);

            $qr = QrCode::create([
                'target_type' => Survey::class,
                'target_id' => $survey->id,
                'token' => Str::random(16),
            ]);
            $survey->update(['qr_code_id' => $qr->id]);

            $this->syncQuestions($survey, $data['questions'] ?? []);

            return $survey;
        });

        $survey->load(['qrCode', 'questions', 'event']);

        return new SurveyResource($survey);
    }

    public function update(Request $request, Survey $survey)
    {
        $data = $this->validateData($request, $survey);

        DB::transaction(function () use ($survey, $data) {
            $survey->update(collect($data)->except('questions')->toArray());
            $this->syncQuestions($survey, $data['questions'] ?? []);
        });

        $survey->load(['qrCode', 'questions', 'event']);

        return new SurveyResource($survey);
    }

    public function destroy(Survey $survey)
    {
        $survey->delete();

        return response()->noContent();
    }

    private function syncQuestions(Survey $survey, array $questions): void
    {
        $keepIds = [];
        foreach ($questions as $i => $q) {
            $payload = [
                'step' => (int) ($q['step'] ?? 1),
                'sort_order' => (int) ($q['sort_order'] ?? $i),
                'type' => $q['type'],
                'label' => $q['label'],
                'help_text' => $q['help_text'] ?? null,
                'options' => $q['options'] ?? null,
                'is_required' => (bool) ($q['is_required'] ?? false),
                'visibility_rules' => $q['visibility_rules'] ?? null,
            ];

            if (! empty($q['id'])) {
                $existing = $survey->questions()->whereKey($q['id'])->first();
                if ($existing) {
                    $existing->update($payload);
                    $keepIds[] = $existing->id;
                    continue;
                }
            }

            $created = $survey->questions()->create($payload);
            $keepIds[] = $created->id;
        }

        $survey->questions()->whereNotIn('id', $keepIds)->delete();
    }

    private function validateData(Request $request, ?Survey $survey = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('surveys', 'slug')->ignore($survey?->id)],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:draft,active,closed'],
            'event_id' => ['nullable', 'integer', 'exists:events,id'],
            'questions' => ['nullable', 'array'],
            'questions.*.id' => ['nullable', 'integer'],
            'questions.*.step' => ['nullable', 'integer', 'min:1'],
            'questions.*.sort_order' => ['nullable', 'integer'],
            'questions.*.type' => ['required_with:questions', 'in:short_text,long_text,single_choice,multi_choice,rating,email,phone,consent'],
            'questions.*.label' => ['required_with:questions', 'string'],
            'questions.*.help_text' => ['nullable', 'string'],
            'questions.*.options' => ['nullable', 'array'],
            'questions.*.is_required' => ['nullable', 'boolean'],
            'questions.*.visibility_rules' => ['nullable', 'array'],
        ]);
    }
}
