<?php

namespace App\Http\Controllers;

use App\Models\JobVacancy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class JobVacancyController extends Controller
{
    public const STATUSES = ['open', 'closing', 'closed'];
    public const EMPLOYMENT_TYPES = ['full_time', 'contract', 'internship'];

    // ------------------------------------------------------------------
    // PUBLIC
    // ------------------------------------------------------------------

    public function index(Request $request)
    {
        $query = JobVacancy::query()->where('is_published', true);

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('position', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('major')) {
            $query->where('major', 'like', "%{$request->query('major')}%");
        }

        if ($request->filled('city')) {
            $query->where('city', $request->query('city'));
        }

        if ($request->filled('employment_type')) {
            $query->where('employment_type', $request->query('employment_type'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $query->orderByRaw("CASE status WHEN 'open' THEN 1 WHEN 'closing' THEN 2 ELSE 3 END")
            ->orderBy('deadline')
            ->orderByDesc('created_at');

        $limit = min(max((int) $request->query('limit', 9), 1), 60);
        $page = max((int) $request->query('page', 1), 1);

        $total = (clone $query)->count();
        $rows = (clone $query)
            ->skip(($page - 1) * $limit)
            ->take($limit)
            ->get();

        return response()->json([
            'data' => $rows,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'last_page' => max((int) ceil($total / $limit), 1),
            ],
            'error' => null,
        ]);
    }

    public function show(string $slug)
    {
        $row = JobVacancy::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->first();

        if (! $row) {
            return response()->json(['data' => null, 'error' => ['message' => 'Lowongan tidak ditemukan.']], 404);
        }

        return response()->json(['data' => $row, 'error' => null]);
    }

    // ------------------------------------------------------------------
    // ADMIN
    // ------------------------------------------------------------------

    public function adminIndex(Request $request)
    {
        $query = JobVacancy::query();

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('position', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('employment_type')) {
            $query->where('employment_type', $request->query('employment_type'));
        }

        $query->orderByDesc('created_at');

        $limit = min(max((int) $request->query('limit', 10), 1), 100);
        $page = max((int) $request->query('page', 1), 1);

        $total = (clone $query)->count();
        $rows = (clone $query)
            ->skip(($page - 1) * $limit)
            ->take($limit)
            ->get();

        return response()->json([
            'data' => $rows,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'last_page' => max((int) ceil($total / $limit), 1),
            ],
            'error' => null,
        ]);
    }

    public function store(Request $request)
    {
        $payload = $this->validatedPayload($request);

        if (empty($payload['company_name']) || empty($payload['position'])) {
            throw ValidationException::withMessages(['company_name' => 'Nama perusahaan dan posisi wajib diisi.']);
        }

        $job = JobVacancy::create($payload + [
            'slug' => $this->uniqueSlug($payload['slug'] ?? Str::slug($payload['company_name'].'-'.$payload['position'])),
            'company_logo' => $this->resolveLogo($request),
        ]);

        return response()->json(['data' => $job->fresh(), 'error' => null], 201);
    }

    public function update(Request $request, string $id)
    {
        $job = JobVacancy::findOrFail($id);
        $data = $request->all();

        $payload = $this->validatedPayload($request, $job);

        if (array_key_exists('company_name', $data) || array_key_exists('position', $data)) {
            if (empty($payload['company_name']) || empty($payload['position'])) {
                throw ValidationException::withMessages(['company_name' => 'Nama perusahaan dan posisi wajib diisi.']);
            }
        }

        if (array_key_exists('slug', $data) && ! empty($data['slug'])) {
            $payload['slug'] = $this->uniqueSlug($data['slug'], $job->id);
        } elseif (! array_key_exists('slug', $data) && ($data['company_name'] ?? null) !== $job->company_name) {
            $payload['slug'] = $this->uniqueSlug(Str::slug($data['company_name'].'-'.($data['position'] ?? $job->position)), $job->id);
        }

        $logo = $this->resolveLogo($request);
        if ($logo !== '' && $logo !== $job->company_logo) {
            $this->deleteFileFromUrl($job->company_logo);
            $payload['company_logo'] = $logo;
        }

        if (! empty($payload)) {
            $job->update($payload);
        }

        return response()->json(['data' => $job->fresh(), 'error' => null]);
    }

    public function destroy(string $id)
    {
        $job = JobVacancy::findOrFail($id);

        $this->deleteFileFromUrl($job->company_logo);
        $job->delete();

        return response()->json(['data' => null, 'error' => null]);
    }

    // ------------------------------------------------------------------
    // HELPERS
    // ------------------------------------------------------------------

    protected function validatedPayload(Request $request, ?JobVacancy $job = null): array
    {
        $data = $request->all();

        $rules = [
            'company_name' => 'nullable|string',
            'position' => 'nullable|string',
            'company_description' => 'nullable|string',
            'job_description' => 'nullable|string',
            'responsibilities' => 'nullable|string',
            'requirements' => 'nullable|string',
            'benefits' => 'nullable|string',
            'education' => 'nullable|string',
            'experience' => 'nullable|string',
            'major' => 'nullable|string',
            'city' => 'nullable|string',
            'location' => 'nullable|string',
            'registration_link' => 'nullable|string',
            'hr_contact' => 'nullable|string',
            'employment_type' => 'nullable|in:'.implode(',', self::EMPLOYMENT_TYPES),
            'status' => 'nullable|in:'.implode(',', self::STATUSES),
            'deadline' => 'nullable|date',
            'slug' => 'nullable|string|max:255',
            'is_published' => 'nullable|boolean',
        ];

        $validated = $request->validate($rules);

        $payload = [];
        foreach (array_keys($rules) as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = $validated[$field] ?? null;
            }
        }

        if (array_key_exists('deadline', $payload)) {
            $payload['deadline'] = $payload['deadline'] ?: null;
        }
        if (array_key_exists('is_published', $payload)) {
            $payload['is_published'] = ! empty($payload['is_published']);
        }

        return $payload;
    }

    protected function resolveLogo(Request $request): string
    {
        if ($request->hasFile('company_logo')) {
            $request->validate([
                'company_logo' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            ]);

            return $this->storeFile($request->file('company_logo'));
        }

        $logo = $request->input('company_logo');
        if (is_string($logo) && $logo !== '') {
            return $logo;
        }

        return '';
    }

    protected function storeFile($file): string
    {
        $directory = 'bkk/logos/'.now()->format('Y/m');
        $name = uniqid().'-'.Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)).'.'.$file->getClientOriginalExtension();
        Storage::disk('public')->putFileAs($directory, $file, $name);

        return '/storage/'.$directory.'/'.$name;
    }

    protected function deleteFileFromUrl(string $url): void
    {
        if (empty($url)) {
            return;
        }
        $prefix = '/storage/';
        if (str_starts_with($url, $prefix)) {
            Storage::disk('public')->delete(substr($url, strlen($prefix)));
        }
    }

    protected function uniqueSlug(string $slug, ?string $ignoreId = null): string
    {
        $slug = Str::slug($slug) ?: 'lowongan';
        $base = $slug;
        $i = 2;
        $query = JobVacancy::query()->where('slug', $slug);
        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }
        while ($query->exists()) {
            $slug = $base.'-'.$i;
            $i++;
        }

        return $slug;
    }
}