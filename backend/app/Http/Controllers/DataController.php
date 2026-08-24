<?php

namespace App\Http\Controllers;

use App\Models\MadingPost;
use App\Models\Profile;
use App\Models\PpdbActivityLog;
use App\Models\PpdbDocument;
use App\Models\PpdbRegistration;
use App\Services\MadingService;
use App\Services\PermissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * REST data adapter used only to keep the existing React CRUD calls intact
 * while they are progressively represented by dedicated REST resources.
 * It replaces the former browser-to-database table client; every request is
 * authorized here before touching PostgreSQL.
 */
class DataController extends Controller
{
    private const MODELS = [
        'news' => \App\Models\News::class, 'programs' => \App\Models\Program::class,
        'facilities' => \App\Models\Facility::class, 'staff' => \App\Models\Staff::class,
        'achievements' => \App\Models\Achievement::class, 'teacher_activities' => \App\Models\TeacherActivity::class,
        'education_staff' => \App\Models\EducationStaff::class, 'spmb_content' => \App\Models\SpmbContent::class,
        'osis' => \App\Models\Osis::class, 'osis_members' => \App\Models\OsisMember::class,
        'osis_activities' => \App\Models\OsisActivity::class,         'extracurriculars' => \App\Models\Extracurricular::class,
        'mading_categories' => \App\Models\MadingCategory::class,
        'mading_posts' => \App\Models\MadingPost::class, 'roles' => \App\Models\Role::class,
        'permissions' => \App\Models\Permission::class, 'role_permissions' => \App\Models\RolePermission::class,
        'students' => \App\Models\Student::class, 'student_accounts' => \App\Models\StudentAccount::class,
        'profiles' => \App\Models\Profile::class, 'contact_messages' => \App\Models\ContactMessage::class,
        'ppdb_registrations' => \App\Models\PpdbRegistration::class, 'ppdb_documents' => \App\Models\PpdbDocument::class,
        'ppdb_activity_log' => \App\Models\PpdbActivityLog::class, 'content_records' => \App\Models\ContentRecord::class,
        'alumni_graduations' => \App\Models\AlumniGraduation::class,
    ];
    private const PUBLIC = ['news','programs','facilities','staff','achievements','teacher_activities','education_staff','spmb_content','osis','osis_members','osis_activities','extracurriculars','mading_categories','content_records'];

    /**
     * Kolom file per tabel compat. dipakai untuk hapus fisik saat update/destroy.
     */
    private const MEDIA_COLUMNS = [
        'news' => ['thumbnail'],
        'programs' => ['logo', 'image'],
        'facilities' => ['photo'],
        'staff' => ['photo'],
        'achievements' => ['photo'],
        'teacher_activities' => ['photo'],
        'education_staff' => ['photo'],
        'spmb_content' => ['banner_image', 'pdf_attachment'],
        'osis' => ['logo'],
        'osis_members' => ['photo'],
        'osis_activities' => ['photo'],
        'extracurriculars' => ['logo', 'photo'],
        'mading_posts' => ['cover_image', 'images'],
        'profiles' => ['photo'],
        'content_records' => ['data'],
    ];

    public function __construct(private PermissionService $permissions, private MadingService $mading) {}

    public function index(Request $request, string $table)
    {
        $model = $this->model($table); $user = $request->user();
        $this->authorizeRead($table, $user);
        $query = $model::query();
        if ($table === 'mading_posts') $query->with('category');
        foreach ($request->query() as $key => $value) {
            if (in_array($key, ['order','limit','single','count'], true) || !in_array($key, (new $model)->getFillable(), true)) continue;
            $query->where($key, $value);
        }
        if ((! $user || ! $this->permissions->isAdmin($user)) && in_array($table, ['osis_activities', 'extracurriculars'], true) && in_array($table, self::PUBLIC, true)) {
            $query->where('status', 'published');
        }
        if ($table === 'content_records' && ! $user && ! in_array($request->query('content_type'), ['home', 'bkk_home', 'bkk_contact'], true)) {
            abort(404);
        }
        if ($table === 'mading_posts' && $user && !$this->permissions->hasPermission($user, 'mading.view')) {
            $query->where(fn ($q) => $q->where('status', 'published')->orWhere('author_id', $user->id));
        }
        if (in_array($table, ['ppdb_registrations','ppdb_documents','ppdb_activity_log'], true) && !$this->permissions->isStaff($user)) {
            if ($table === 'ppdb_registrations') $query->where('user_id', $user?->id);
            else $query->whereHas('application', fn ($q) => $q->where('user_id', $user?->id));
        }
        if ($order = $request->query('order')) { [$column, $direction] = explode('|', $order) + [null, 'asc']; if (in_array($column, (new $model)->getFillable(), true)) $query->orderBy($column, $direction === 'desc' ? 'desc' : 'asc'); }
        $count = $request->query('count') === 'exact' ? $query->count() : null;
        if ($request->filled('limit')) $query->limit((int) $request->query('limit'));
        $rows = $query->get()->map(fn ($row) => $this->serialize($table, $row));
        return response()->json(['data' => $request->boolean('single') ? $rows->first() : $rows, 'error' => null, 'count' => $count]);
    }

    public function store(Request $request, string $table)
    {
        $this->authorizeWrite($table, $request->user()); $model = $this->model($table);
        $rows = $this->requestBody($request); if (!array_is_list($rows)) $rows = [$rows]; $created = [];
        foreach ($rows as $payload) {
            $payload = $this->payload($model, $payload);
            if ($table === 'mading_posts') $payload = $this->mading->guardInsert($request->user(), $payload);
            if ($table === 'ppdb_registrations') $payload['user_id'] = $request->user()->id;
            if ($table === 'ppdb_activity_log') {
                $registration = PpdbRegistration::findOrFail($payload['application_id'] ?? null);
                abort_unless($registration->user_id === $request->user()->id || $this->permissions->isAdmin($request->user()), 403);
            }
            if ($table === 'ppdb_documents') {
                $registration = PpdbRegistration::findOrFail($payload['application_id'] ?? null);
                abort_unless($registration->user_id === $request->user()->id || $this->permissions->isAdmin($request->user()), 403);
            }
            $created[] = $model::create($payload);
        }
        return response()->json(['data' => count($created) === 1 ? $this->serialize($table, $created[0]) : $created, 'error' => null], 201);
    }

    public function update(Request $request, string $table)
    {
        $this->authorizeWrite($table, $request->user()); $model = $this->model($table); $query = $model::query();
        foreach ($request->query() as $key => $value) if (in_array($key, (new $model)->getFillable(), true) || $key === 'id') $query->where($key, $value);
        $row = $query->firstOrFail(); $payload = $this->payload($model, $this->requestBody($request));
        if ($table === 'mading_posts') $payload = $this->mading->guardUpdate($request->user(), $row, $payload);
        if ($table === 'ppdb_registrations' && $row->user_id !== $request->user()?->id && !$this->permissions->isAdmin($request->user())) abort(403);
        if ($table === 'ppdb_documents' && $row->application->user_id !== $request->user()?->id && !$this->permissions->isAdmin($request->user())) abort(403);
        $this->cleanupReplacedFiles($table, $row, $payload);
        $row->update($payload); return response()->json(['data' => $this->serialize($table, $row->fresh()), 'error' => null]);
    }

    public function destroy(Request $request, string $table)
    {
        $this->authorizeWrite($table, $request->user()); $model = $this->model($table); $query = $model::query();
        foreach ($request->query() as $key => $value) if (in_array($key, (new $model)->getFillable(), true) || $key === 'id') $query->where($key, $value);
        $rows = $query->get();
        foreach ($rows as $row) {
            if ($table === 'mading_posts') {
                $isOwnerDraft = $row->author_id === $request->user()?->id && in_array($row->status, ['draft', 'rejected'], true);
                abort_unless($isOwnerDraft || $this->permissions->hasPermission($request->user(), 'mading.delete'), 403);
            }
            if ($table === 'ppdb_documents' && $row->application->user_id !== $request->user()?->id && !$this->permissions->isStaff($request->user())) abort(403);
            if ($table === 'ppdb_documents' && $row->file_path) Storage::disk('public')->delete($row->file_path);
            $this->deleteRowFiles($table, $row);
            $row->delete();
        }
        return response()->json(['data' => null, 'error' => null]);
    }

    private function model(string $table): string { abort_unless(isset(self::MODELS[$table]), 404); return self::MODELS[$table]; }
    private function requestBody(Request $request): array {
        if ($request->isJson()) return $request->json()->all();
        return $request->except(['single', 'order', 'limit', 'count']);
    }
    private function cleanupReplacedFiles(string $table, $row, array $payload): void
    {
        $fields = self::MEDIA_COLUMNS[$table] ?? [];
        if ($table === 'mading_posts') {
            // cover_image: string; images: JSON array string; content_records: JSON blob handled separately
            $fields = ['cover_image', 'images'];
        }
        foreach ($fields as $field) {
            if (! array_key_exists($field, $payload)) {
                continue;
            }
            $oldRaw = $row->{$field} ?? null;
            $newRaw = $payload[$field] ?? null;

            $oldUrls = $this->extractUrls($table, $field, $oldRaw);
            $newUrls = $this->extractUrls($table, $field, $newRaw);

            // Hapus file lama yang tidak lagi dipakai (diff old - new)
            foreach (array_diff($oldUrls, $newUrls) as $oldUrl) {
                if ($oldUrl !== '') {
                    $this->deleteStoredFile($oldUrl);
                }
            }
        }
        // content_records.data = JSON (home/bkk) — diff URL di dalam JSON blob
        if ($table === 'content_records' && array_key_exists('data', $payload)) {
            $oldUrls = $this->extractUrls($table, 'data', $row->data ?? null);
            $newUrls = $this->extractUrls($table, 'data', $payload['data'] ?? null);
            foreach (array_diff($oldUrls, $newUrls) as $oldUrl) {
                $this->deleteStoredFile($oldUrl);
            }
        }
    }
    private function deleteRowFiles(string $table, $row): void
    {
        foreach (self::MEDIA_COLUMNS[$table] ?? [] as $field) {
            $value = $row->{$field} ?? null;
            foreach ($this->extractUrls($table, $field, $value) as $url) {
                $this->deleteStoredFile($url);
            }
        }
        // mading_posts.images is JSON array — handled by extractUrls
        // content_records.data handled same
    }
    private function extractUrls(string $table, string $field, mixed $value): array
    {
        if ($value === null || $value === '') {
            return [];
        }
        // images: JSON array of string URLs / objects with image/url
        if ($field === 'images') {
            $arr = is_string($value) ? json_decode($value, true) : $value;
            if (! is_array($arr)) {
                return is_string($value) && str_starts_with($value, '/storage/') ? [$value] : [];
            }
            $out = [];
            foreach ($arr as $item) {
                if (is_string($item) && $item !== '') {
                    $out[] = $item;
                } elseif (is_array($item)) {
                    $u = $item['image'] ?? $item['url'] ?? $item['src'] ?? null;
                    if (is_string($u) && $u !== '') {
                        $out[] = $u;
                    }
                }
            }
            return $out;
        }
        // content_records.data: scan JSON for /storage/ strings
        if ($table === 'content_records' && $field === 'data') {
            $json = is_string($value) ? $value : json_encode($value);
            if (! is_string($json)) {
                return [];
            }
            preg_match_all('#/storage/[^\s"\'<>]+#', $json, $m);
            return $m[0] ?? [];
        }
        // spmb_content banner/pdf are plain strings
        if (is_array($value)) {
            // documentation array — collect strings that look like /storage/
            $out = [];
            foreach ($value as $v) {
                if (is_string($v) && str_starts_with($v, '/storage/')) {
                    $out[] = $v;
                }
            }
            return $out;
        }
        return is_string($value) && str_starts_with($value, '/storage/') ? [$value] : [];
    }
    private function deleteStoredFile(?string $url): void
    {
        if (empty($url)) return;
        $path = parse_url($url, PHP_URL_PATH) ?? $url;
        $prefix = '/storage/';
        if (str_starts_with($path, $prefix)) {
            $path = substr($path, strlen($prefix));
        } else {
            $path = ltrim($path, '/');
            if (! str_starts_with($url, '/storage/')) {
                return;
            }
        }
        if ($path !== '') {
            Storage::disk('public')->delete($path);
        }
    }
    private function payload(string $model, array $payload): array { return collect($payload)->only((new $model)->getFillable())->except(['id','created_at','updated_at','user_id'])->all(); }
    private function authorizeRead(string $table, $user): void {
        if (in_array($table, self::PUBLIC, true)) return;
        if ($table === 'mading_posts') return;
        abort_unless($user, 401);
        if ($table === 'profiles') abort_unless($this->permissions->isStaff($user) || request('id') === $user->id, 403);
        elseif (in_array($table, ['ppdb_registrations','ppdb_documents','ppdb_activity_log'], true)) return;
        else abort_unless($this->permissions->isStaff($user), 403);
    }
    private function authorizeWrite(string $table, $user): void {
        abort_unless($user, 401);
        if ($table === 'mading_posts') return;
        if (in_array($table, ['ppdb_registrations','ppdb_documents','ppdb_activity_log'], true)) return;
        if ($table === 'profiles') { abort_unless(request('id') === $user->id || $this->permissions->isAdmin($user), 403); return; }
        if (in_array($table, ['news','programs','facilities','staff','achievements','teacher_activities','education_staff','spmb_content','contact_messages','roles','permissions','role_permissions','content_records'], true)) { abort_unless($this->permissions->isAdmin($user), 403); return; }
        $permission = match ($table) {
            'osis', 'osis_members' => request()->isMethod('DELETE') ? 'osis.delete' : (request()->isMethod('POST') ? 'osis.create' : 'osis.edit'),
            'osis_activities' => request()->isMethod('DELETE') ? 'osis.activities.delete' : (request()->isMethod('POST') ? 'osis.activities.create' : 'osis.activities.edit'),
            'extracurriculars' => request()->isMethod('DELETE') ? 'extracurricular.delete' : (request()->isMethod('POST') ? 'extracurricular.create' : 'extracurricular.edit'),
            'mading_categories', 'students', 'student_accounts' => 'mading.edit_all',
            default => null,
        };
        abort_unless($permission && $this->permissions->hasPermission($user, $permission), 403);
    }
    private function serialize(string $table, $row): array {
        $data = $row->toArray();
        if ($table === 'mading_posts') $data['mading_categories'] = !empty($data['category']) ? ['name' => $data['category']['name']] : null;
        return $data;
    }
}
