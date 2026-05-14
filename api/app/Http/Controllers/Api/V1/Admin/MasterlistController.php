<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Masterlist;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStartRow;
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
            ->get(['id', 'first_name', 'middle_name', 'last_name', 'belongs_to', 'purok', 'grupo', 'login_code'])
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
        $grupo = $request->query('grupo');

        $query = Masterlist::query()
            ->when($q, fn ($qb) => $qb->where(function ($w) use ($q) {
                $w->where('first_name', 'like', "%{$q}%")
                    ->orWhere('middle_name', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('phone', 'like', "%{$q}%");
            }))
            ->when($belongsTo, fn ($qb, $b) => $qb->where('belongs_to', $b))
            ->when($grupo, fn ($qb, $g) => $qb->where('grupo', 'like', "%{$g}%"))
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

    /** Download a blank import template (Excel) */
    public function template()
    {
        return Excel::download(new MasterlistTemplate(), 'masterlist-import-template.xlsx');
    }

    /** Import from uploaded Excel / CSV file */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:5120',
        ]);

        $import = new MasterlistImport();
        Excel::import($import, $request->file('file'));

        return response()->json([
            'message'  => 'Import complete.',
            'imported' => $import->imported,
            'skipped'  => $import->skipped,
            'errors'   => $import->errors,
        ]);
    }

    /** Create a single masterlist entry */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name'  => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name'   => 'required|string|max:100',
            'belongs_to'  => 'required|in:Binhi,Kadiwa,Buklod',
            'purok'       => 'nullable|string|max:100',
            'grupo'       => 'nullable|string|max:150',
            'email'       => 'nullable|email|max:150',
            'phone'       => 'nullable|string|max:30',
            'birthdate'   => 'nullable|date',
        ]);

        $fn = ucwords(strtolower(trim($validated['first_name'])));
        $mn = !empty($validated['middle_name']) ? ucwords(strtolower(trim($validated['middle_name']))) : null;
        $ln = ucwords(strtolower(trim($validated['last_name'])));

        $exists = Masterlist::where('first_name', $fn)
            ->where('last_name', $ln)
            ->where('belongs_to', $validated['belongs_to'])
            ->when($mn, fn ($q) => $q->where('middle_name', $mn))
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'A member with the same name and affiliation already exists.'], 422);
        }

        $member = Masterlist::create([
            'first_name'  => $fn,
            'middle_name' => $mn,
            'last_name'   => $ln,
            'belongs_to'  => $validated['belongs_to'],
            'purok'       => $validated['purok'] ?: null,
            'grupo'       => $validated['grupo'] ?: null,
            'email'       => !empty($validated['email']) ? strtolower($validated['email']) : null,
            'phone'       => $validated['phone'] ?: null,
            'birthdate'   => $validated['birthdate'] ?: null,
            'source'      => 'manual',
            'tags'        => [],
        ]);

        // then middle initial (if any), then last initial.
        $fnInits  = implode('', array_map(
            fn ($w) => strtoupper($w[0]),
            array_filter(preg_split('/\s+/', trim($fn)))
        ));
        $initials = $fnInits . ($mn ? strtoupper($mn[0]) : '') . strtoupper($ln[0]);
        $member->login_code = $member->birthdate
            ? $initials . $member->birthdate->format('mdy')
            : $initials . str_pad((string) $member->id, 6, '0', STR_PAD_LEFT);
        $member->save();

        return response()->json(['data' => $member, 'message' => 'Member created.'], 201);
    }

    /** Update a single masterlist entry */
    public function update(Request $request, Masterlist $masterlist)
    {
        $validated = $request->validate([
            'first_name'  => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'last_name'   => 'required|string|max:100',
            'belongs_to'  => 'required|in:Binhi,Kadiwa,Buklod',
            'purok'       => 'nullable|string|max:100',
            'grupo'       => 'nullable|string|max:150',
            'email'       => 'nullable|email|max:150',
            'phone'       => 'nullable|string|max:30',
            'birthdate'   => 'nullable|date',
        ]);

        $fn = ucwords(strtolower(trim($validated['first_name'])));
        $mn = !empty($validated['middle_name']) ? ucwords(strtolower(trim($validated['middle_name']))) : null;
        $ln = ucwords(strtolower(trim($validated['last_name'])));

        $masterlist->update([
            'first_name'  => $fn,
            'middle_name' => $mn,
            'last_name'   => $ln,
            'belongs_to'  => $validated['belongs_to'],
            'purok'       => $validated['purok'] ?: null,
            'grupo'       => $validated['grupo'] ?: null,
            'email'       => !empty($validated['email']) ? strtolower($validated['email']) : null,
            'phone'       => $validated['phone'] ?: null,
            'birthdate'   => $validated['birthdate'] ?: null,
        ]);

        $masterlist->refresh();
        $fnInits  = implode('', array_map(
            fn ($w) => strtoupper($w[0]),
            array_filter(preg_split('/\s+/', trim($fn)))
        ));
        $initials = $fnInits . ($mn ? strtoupper($mn[0]) : '') . strtoupper($ln[0]);
        $masterlist->login_code = $masterlist->birthdate
            ? $initials . $masterlist->birthdate->format('mdy')
            : $initials . str_pad((string) $masterlist->id, 6, '0', STR_PAD_LEFT);
        $masterlist->save();

        return response()->json(['data' => $masterlist, 'message' => 'Member updated.']);
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
        return ['First Name', 'Middle Name', 'Last Name', 'Belongs To', 'Purok', 'Grupo', 'Email', 'Phone',
            'Events', 'Surveys', 'Last Activity', 'Login Code', 'Source', 'Tags'];
    }

    public function map($row): array
    {
        return [
            $row->first_name,
            $row->middle_name,
            $row->last_name,
            $row->belongs_to,
            $row->purok,
            $row->grupo,
            $row->email,
            $row->phone,
            $row->events_count,
            $row->surveys_count,
            optional($row->last_activity_at)->toDateTimeString(),
            $row->login_code,
            $row->source,
            implode(', ', $row->tags ?? []),
        ];
    }
}

/* ─────────────────────────────────────────────────────────────
   Import Template (blank sheet with headers + sample row)
───────────────────────────────────────────────────────────── */
class MasterlistTemplate implements FromArray, WithHeadings
{
    public function array(): array
    {
        // Sample row: first_name, middle_name, last_name, belongs_to, purok, grupo, email, phone, birthdate
        return [
            ['Juan', 'Dela', 'Cruz', 'Kadiwa', '3', '1', 'juan@email.com', '09171234567', '1990-05-21'],
        ];
    }

    public function headings(): array
    {
        return ['first_name', 'middle_name', 'last_name', 'belongs_to', 'purok', 'grupo', 'email', 'phone', 'birthdate'];
    }
}

/* ─────────────────────────────────────────────────────────────
   Import (reads uploaded file, deduplicates, normalizes case)
───────────────────────────────────────────────────────────── */
class MasterlistImport implements ToCollection, WithStartRow
{
    public int $imported = 0;
    public int $skipped  = 0;
    /** @var array<string> */
    public array $errors = [];

    private const VALID_AFFILIATIONS = ['Binhi', 'Kadiwa', 'Buklod'];

    public function startRow(): int { return 2; }

    public function collection(Collection $rows)
    {
        foreach ($rows as $i => $row) {
            $rowNum = $i + 2;

            $firstName  = $this->normalizeCase((string) ($row[0] ?? ''));
            $middleName = $this->normalizeCase((string) ($row[1] ?? ''));
            $lastName   = $this->normalizeCase((string) ($row[2] ?? ''));
            $belongsTo  = $this->normalizeAffiliation((string) ($row[3] ?? ''));
            $purok      = trim((string) ($row[4] ?? ''));
            $grupo      = trim((string) ($row[5] ?? ''));
            $email      = strtolower(trim((string) ($row[6] ?? '')));
            $phone      = trim((string) ($row[7] ?? ''));
            $birthdateRaw = trim((string) ($row[8] ?? ''));

            if (!$firstName || !$lastName || !$belongsTo) {
                $this->errors[] = "Row {$rowNum}: first_name, last_name, and belongs_to are required.";
                $this->skipped++;
                continue;
            }

            if (!in_array($belongsTo, self::VALID_AFFILIATIONS, true)) {
                $this->errors[] = "Row {$rowNum}: invalid belongs_to '{$belongsTo}'. Must be Binhi, Kadiwa, or Buklod.";
                $this->skipped++;
                continue;
            }

            // Parse birthdate (accepts YYYY-MM-DD, MM/DD/YYYY, etc.)
            $birthdate = null;
            if ($birthdateRaw) {
                try {
                    $birthdate = \Carbon\Carbon::parse($birthdateRaw)->toDateString();
                } catch (\Exception $e) {
                    $this->errors[] = "Row {$rowNum}: invalid birthdate '{$birthdateRaw}'. Use YYYY-MM-DD format.";
                }
            }

            // Duplicate check (normalised names, same group)
            $exists = Masterlist::where('first_name', $firstName)
                ->where('last_name', $lastName)
                ->where('belongs_to', $belongsTo)
                ->when($middleName, fn ($q) => $q->where('middle_name', $middleName))
                ->exists();

            if ($exists) {
                $this->skipped++;
                continue;
            }

            $member = Masterlist::create([
                'first_name'  => $firstName,
                'middle_name' => $middleName ?: null,
                'last_name'   => $lastName,
                'belongs_to'  => $belongsTo,
                'purok'       => $purok ?: null,
                'grupo'       => $grupo ?: null,
                'email'       => $email ?: null,
                'phone'       => $phone ?: null,
                'birthdate'   => $birthdate,
                'source'      => 'excel_import',
                'tags'        => [],
            ]);

            // Generate login_code: INITIALS + MMDDYY(birthdate), or fallback to INITIALS + paddedID
            $nameParts = array_filter([$firstName, $middleName, $lastName]);
            $initials  = implode('', array_map(fn ($p) => strtoupper($p[0]), $nameParts));
            if ($birthdate) {
                $loginCode = $initials . \Carbon\Carbon::parse($birthdate)->format('mdy'); // MMDDYY
            } else {
                $loginCode = $initials . str_pad((string) $member->id, 6, '0', STR_PAD_LEFT);
            }
            $member->login_code = $loginCode;
            $member->save();

            $this->imported++;
        }
    }

    private function normalizeCase(string $value): string
    {
        return ucwords(strtolower(trim($value)));
    }

    private function normalizeAffiliation(string $value): string
    {
        $map = ['binhi' => 'Binhi', 'kadiwa' => 'Kadiwa', 'buklod' => 'Buklod'];
        return $map[strtolower(trim($value))] ?? ucfirst(strtolower(trim($value)));
    }
}
