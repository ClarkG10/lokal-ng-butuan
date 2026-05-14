<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Masterlist;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Facades\Excel;

class MasterlistController extends Controller
{
    public function search(Request $request)
    {
        $q = trim($request->query('q', ''));

        if (strlen($q) < 2) {
            return response()->json(['data' => []]);
        }

        $results = Masterlist::query()
            ->where(function ($w) use ($q) {
                $w->where('first_name', 'like', "%{$q}%")
                    ->orWhere('middle_name', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('phone', 'like', "%{$q}%");
            })
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->limit((int) $request->query('per_page', 5))
            ->get(['id', 'first_name', 'middle_name', 'last_name', 'belongs_to', 'purok'])
            ->map(function ($row) {
                $row->full_name = trim(implode(' ', array_filter([
                    $row->first_name, $row->middle_name, $row->last_name,
                ])));
                return $row;
            });

        return response()->json(['data' => $results]);
    }

    public function index(Request $request)
    {
        $q = $request->query('q');
        $minEvents = (int) $request->query('min_events', 0);
        $minSurveys = (int) $request->query('min_surveys', 0);
        $belongsTo = $request->query('belongs_to');

        $query = Masterlist::query()
            ->when($q, fn ($qb) => $qb->where(function ($w) use ($q) {
                $w->where('first_name', 'like', "%{$q}%")
                    ->orWhere('middle_name', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('phone', 'like', "%{$q}%");
            }))
            ->when($belongsTo, fn ($qb, $b) => $qb->where('belongs_to', $b))
            ->where('events_count', '>=', $minEvents)
            ->where('surveys_count', '>=', $minSurveys)
            ->orderByDesc('last_activity_at');

        $page = $query->paginate((int) $request->query('per_page', 25));

        // Append computed full_name to every row for the frontend.
        $page->getCollection()->transform(function ($row) {
            $row->full_name = trim(implode(' ', array_filter([
                $row->first_name, $row->middle_name, $row->last_name,
            ])));
            return $row;
        });

        return response()->json([
            'data' => $page->items(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page'    => $page->lastPage(),
                'per_page'     => $page->perPage(),
                'total'        => $page->total(),
            ],
        ]);
    }

    public function export(Request $request)
    {
        return Excel::download(new MasterlistExport($request), 'masterlist-' . now()->format('Y-m-d') . '.csv');
    }
}

class MasterlistExport implements FromQuery, WithHeadings, WithMapping
{
    public function __construct(private Request $request) {}

    public function query()
    {
        $q = $this->request->query('q');
        $belongsTo = $this->request->query('belongs_to');

        return Masterlist::query()
            ->when($q, fn ($qb) => $qb->where(function ($w) use ($q) {
                $w->where('first_name', 'like', "%{$q}%")
                    ->orWhere('middle_name', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('phone', 'like', "%{$q}%");
            }))
            ->when($belongsTo, fn ($qb, $b) => $qb->where('belongs_to', $b))
            ->orderBy('last_name')
            ->orderBy('first_name');
    }

    public function headings(): array
    {
        return ['First Name', 'Middle Name', 'Last Name', 'Belongs To', 'Email', 'Phone',
            'Events', 'Surveys', 'Last Activity', 'Source', 'Tags'];
    }

    public function map($row): array
    {
        return [
            $row->first_name,
            $row->middle_name,
            $row->last_name,
            $row->belongs_to,
            $row->email,
            $row->phone,
            $row->events_count,
            $row->surveys_count,
            optional($row->last_activity_at)->toDateTimeString(),
            $row->source,
            implode(', ', $row->tags ?? []),
        ];
    }
}
