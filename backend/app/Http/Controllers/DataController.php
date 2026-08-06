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
        'osis_activities' => \App\Models\OsisActivity::class, 'extracurriculars' => \App\Models\Extracurricular::class,
        'kesemaptaan' => \App\Models\Kesemaptaan::class, 'kesemaptaan_activities' => \App\Models\KesemaptaanActivity::class,
        'kesemaptaan_schedules' => \App\Models\KesemaptaanSchedule::class, 'kesemaptaan_instructors' => \App\Models\KesemaptaanInstructor::class,
        'kesemaptaan_achievements' => \App\Models\KesemaptaanAchievement::class, 'mading_categories' => \App\Models\MadingCategory::class,
        'mading_posts' => \App\Models\MadingPost::class, 'roles' => \App\Models\Role::class,
        'permissions' => \App\Models\Permission::class, 'role_permissions' => \App\Models\RolePermission::class,
        'students' => \App\Models\Student::class, 'student_accounts' => \App\Models\StudentAccount::class,
        'profiles' => \App\Models\Profile::class, 'contact_messages' => \App\Models\ContactMessage::class,
        'ppdb_registrations' => \App\Models\PpdbRegistration::class, 'ppdb_documents' => \App\Models\PpdbDocument::class,
        'ppdb_activity_log' => \App\Models\PpdbActivityLog::class,
    ];
    private const PUBLIC = ['news','programs','facilities','staff','achievements','teacher_activities','education_staff','spmb_content','osis','osis_members','osis_activities','extracurriculars','kesemaptaan','kesemaptaan_activities','kesemaptaan_schedules','kesemaptaan_instructors','kesemaptaan_achievements','mading_categories'];

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
        $row->update($payload); return response()->json(['data' => $this->serialize($table, $row->fresh()), 'error' => null]);
    }

    public function destroy(Request $request, string $table)
    {
        $this->authorizeWrite($table, $request->user()); $model = $this->model($table); $query = $model::query();
        foreach ($request->query() as $key => $value) if (in_array($key, (new $model)->getFillable(), true) || $key === 'id') $query->where($key, $value);
        $rows = $query->get();
        abort_if($rows->isEmpty(), 404);
        foreach ($rows as $row) {
            if ($table === 'mading_posts') {
                $isOwnerDraft = $row->author_id === $request->user()?->id && in_array($row->status, ['draft', 'rejected'], true);
                abort_unless($isOwnerDraft || $this->permissions->hasPermission($request->user(), 'mading.delete'), 403);
            }
            if ($table === 'ppdb_documents' && $row->application->user_id !== $request->user()?->id && !$this->permissions->isStaff($request->user())) abort(403);
            if ($table === 'ppdb_documents' && $row->file_path) Storage::disk('public')->delete($row->file_path);
            $row->delete();
        }
        return response()->json(['data' => null, 'error' => null]);
    }

    private function model(string $table): string { abort_unless(isset(self::MODELS[$table]), 404); return self::MODELS[$table]; }
    private function requestBody(Request $request): array {
        if ($request->isJson()) return $request->json()->all();
        return $request->except(['single', 'order', 'limit', 'count']);
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
        if (in_array($table, ['news','programs','facilities','staff','achievements','teacher_activities','education_staff','spmb_content','contact_messages','roles','permissions','role_permissions'], true)) { abort_unless($this->permissions->isAdmin($user), 403); return; }
        $permission = match ($table) {
            'osis', 'osis_members' => request()->isMethod('DELETE') ? 'osis.delete' : (request()->isMethod('POST') ? 'osis.create' : 'osis.edit'),
            'osis_activities' => request()->isMethod('DELETE') ? 'osis.activities.delete' : (request()->isMethod('POST') ? 'osis.activities.create' : 'osis.activities.edit'),
            'extracurriculars' => request()->isMethod('DELETE') ? 'extracurricular.delete' : (request()->isMethod('POST') ? 'extracurricular.create' : 'extracurricular.edit'),
            'kesemaptaan', 'kesemaptaan_activities', 'kesemaptaan_schedules', 'kesemaptaan_instructors', 'kesemaptaan_achievements' => request()->isMethod('DELETE') ? 'kesemaptaan.delete' : (request()->isMethod('POST') ? 'kesemaptaan.create' : 'kesemaptaan.edit'),
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
