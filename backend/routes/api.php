<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\StudentAuthController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\ContentCrudController;
use App\Http\Controllers\ExtracurricularController;
use App\Http\Controllers\KesemaptaanController;
use App\Http\Controllers\MadingAiController;
use App\Http\Controllers\MadingController;
use App\Http\Controllers\OsisController;
use App\Http\Controllers\PpdbController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RolePermissionController;
use App\Http\Controllers\SpmbController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\DataController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ---------- AUTH ----------
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/logout', [AuthController::class, 'logout']);
Route::get('/auth/me', [AuthController::class, 'me']);
Route::get('/auth/permissions', [AuthController::class, 'permissions']);
Route::post('/auth/student-email', [StudentAuthController::class, 'studentEmail']);

// ---------- PROFILES ----------
Route::get('/profiles/{id}', [ProfileController::class, 'show']);
Route::patch('/profiles/{id}', [ProfileController::class, 'update']);

// ---------- PUBLIC CONTENT ----------
Route::get('/news', [ContentCrudController::class, 'index'])->defaults('type', 'news');
Route::get('/news/{slug}', [ContentCrudController::class, 'show'])->defaults('type', 'news');
Route::get('/programs', [ContentCrudController::class, 'index'])->defaults('type', 'programs');
Route::get('/programs/{slug}', [ContentCrudController::class, 'show'])->defaults('type', 'programs');
Route::get('/facilities', [ContentCrudController::class, 'index'])->defaults('type', 'facilities');
Route::get('/staff', [ContentCrudController::class, 'index'])->defaults('type', 'staff');
Route::get('/achievements', [ContentCrudController::class, 'index'])->defaults('type', 'achievements');
Route::get('/teacher-activities', [ContentCrudController::class, 'index'])->defaults('type', 'teacher-activities');
Route::get('/education-staff', [ContentCrudController::class, 'index'])->defaults('type', 'education-staff');

// ---------- SPMB ----------
Route::get('/spmb', [SpmbController::class, 'index']);

// ---------- OSIS ----------
Route::get('/osis', [OsisController::class, 'profile']);
Route::get('/osis/members', [OsisController::class, 'members']);
Route::get('/osis/activities', [OsisController::class, 'activities']);

// ---------- EXTRACURRICULARS ----------
Route::get('/extracurriculars', [ExtracurricularController::class, 'index']);
Route::get('/extracurriculars/{slug}', [ExtracurricularController::class, 'show']);

// ---------- KESEMAPTAAN ----------
Route::get('/kesemaptaan', [KesemaptaanController::class, 'profile']);
Route::get('/kesemaptaan/activities', [KesemaptaanController::class, 'activities']);
Route::get('/kesemaptaan/schedules', [KesemaptaanController::class, 'schedules']);
Route::get('/kesemaptaan/instructors', [KesemaptaanController::class, 'instructors']);
Route::get('/kesemaptaan/achievements', [KesemaptaanController::class, 'achievements']);

// ---------- MADING ----------
Route::get('/mading/categories', [MadingController::class, 'categories']);
Route::get('/mading/posts', [MadingController::class, 'index']);

// ---------- CONTACT ----------
Route::post('/contact', [ContactController::class, 'store']);
Route::get('/uploads/url', [UploadController::class, 'url'])->middleware('auth:sanctum');
Route::delete('/uploads', [UploadController::class, 'destroy'])->middleware('auth:sanctum');

// Compatibility REST resources for the existing React CRUD layer. They are
// backed by Laravel models and authorization.
Route::get('/data/{table}', [DataController::class, 'index']);
Route::post('/data/{table}', [DataController::class, 'store']);
Route::patch('/data/{table}', [DataController::class, 'update']);
Route::delete('/data/{table}', [DataController::class, 'destroy']);

// ============================================================
// AUTHENTICATED (SPA session)
// ============================================================
Route::middleware('auth:sanctum')->group(function () {
    // Mading workflow
    Route::post('/mading/posts', [MadingController::class, 'store']);
    Route::patch('/mading/posts/{id}', [MadingController::class, 'update']);
    Route::delete('/mading/posts/{id}', [MadingController::class, 'destroy']);
    Route::post('/mading/posts/{id}/submit', [MadingController::class, 'submit']);
    Route::post('/mading/posts/{id}/review', [MadingController::class, 'review']);
    Route::post('/mading/posts/{id}/publish', [MadingController::class, 'publish']);

    // Mading AI Content Assistant. Access: students by default; staff must have
    // the mading.ai_generate permission (checked inside the controller).
    Route::post('/mading/ai/generate', [MadingAiController::class, 'generate']);
    Route::post('/mading/ai/improve', [MadingAiController::class, 'improve']);
    Route::post('/mading/ai/shorten', [MadingAiController::class, 'shorten']);
    Route::post('/mading/ai/expand', [MadingAiController::class, 'expand']);
    Route::post('/mading/ai/change-style', [MadingAiController::class, 'changeStyle']);
    Route::post('/mading/ai/generate-ideas', [MadingAiController::class, 'generateIdeas']);

    // Upload
    Route::post('/upload', [UploadController::class, 'upload']);
});

// ============================================================
// STAFF (admin, guru, osis)
// ============================================================
Route::middleware(['auth:sanctum', 'staff'])->group(function () {
    // Mading categories + admin post management
    Route::post('/mading/categories', [MadingController::class, 'storeCategory'])->middleware('permission:mading.edit_all');
    Route::patch('/mading/categories/{id}', [MadingController::class, 'updateCategory'])->middleware('permission:mading.edit_all');
    Route::delete('/mading/categories/{id}', [MadingController::class, 'destroyCategory'])->middleware('permission:mading.edit_all');

    // Student management (gated by mading.edit_all, replica of frontend nav)
    Route::get('/admin/students', [StudentController::class, 'index'])->middleware('permission:mading.edit_all');
    Route::post('/admin/students', [StudentController::class, 'store'])->middleware('permission:mading.edit_all');
    Route::post('/admin/students/{studentId}/reset-pin', [StudentController::class, 'resetPin'])->middleware('permission:mading.edit_all');
    Route::delete('/admin/students/{studentId}', [StudentController::class, 'destroy'])->middleware('permission:mading.edit_all');

    // Contact messages (admin only in the UI, but keep staff-readable list)
    Route::get('/contact', [ContactController::class, 'index'])->middleware('admin');
    Route::patch('/contact/{id}/read', [ContactController::class, 'markRead'])->middleware('admin');
    Route::delete('/contact/{id}', [ContactController::class, 'destroy'])->middleware('admin');
});

// ============================================================
// ADMIN (role admin only) - content CRUD
// ============================================================
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    // Generic content CRUD
    foreach ([
        'news' => 'news',
        'programs' => 'programs',
        'facilities' => 'facilities',
        'staff' => 'staff',
        'achievements' => 'achievements',
        'teacher-activities' => 'teacher-activities',
        'education-staff' => 'education-staff',
    ] as $path => $type) {
        Route::post('/'.$path, [ContentCrudController::class, 'store'])->defaults('type', $type);
        Route::patch('/'.$path.'/{id}', [ContentCrudController::class, 'update'])->defaults('type', $type);
        Route::delete('/'.$path.'/{id}', [ContentCrudController::class, 'destroy'])->defaults('type', $type);
    }

    // SPMB
    Route::post('/spmb', [SpmbController::class, 'store']);
    Route::patch('/spmb/{id}', [SpmbController::class, 'update']);

    // OSIS
    Route::post('/osis', [OsisController::class, 'storeProfile']);
    Route::patch('/osis/{id}', [OsisController::class, 'updateProfile']);
    Route::post('/osis/members', [OsisController::class, 'storeMember']);
    Route::patch('/osis/members/{id}', [OsisController::class, 'updateMember']);
    Route::delete('/osis/members/{id}', [OsisController::class, 'destroyMember']);
    Route::post('/osis/activities', [OsisController::class, 'storeActivity']);
    Route::patch('/osis/activities/{id}', [OsisController::class, 'updateActivity']);
    Route::delete('/osis/activities/{id}', [OsisController::class, 'destroyActivity']);

    // Extracurricular
    Route::post('/extracurriculars', [ExtracurricularController::class, 'store']);
    Route::patch('/extracurriculars/{id}', [ExtracurricularController::class, 'update']);
    Route::delete('/extracurriculars/{id}', [ExtracurricularController::class, 'destroy']);

    // Kesemaptaan
    Route::post('/kesemaptaan', [KesemaptaanController::class, 'storeProfile']);
    Route::patch('/kesemaptaan/{id}', [KesemaptaanController::class, 'updateProfile']);
    Route::post('/kesemaptaan/activities', [KesemaptaanController::class, 'storeActivity']);
    Route::patch('/kesemaptaan/activities/{id}', [KesemaptaanController::class, 'updateActivity']);
    Route::delete('/kesemaptaan/activities/{id}', [KesemaptaanController::class, 'destroyActivity']);
    Route::post('/kesemaptaan/schedules', [KesemaptaanController::class, 'storeSchedule']);
    Route::patch('/kesemaptaan/schedules/{id}', [KesemaptaanController::class, 'updateSchedule']);
    Route::delete('/kesemaptaan/schedules/{id}', [KesemaptaanController::class, 'destroySchedule']);
    Route::post('/kesemaptaan/instructors', [KesemaptaanController::class, 'storeInstructor']);
    Route::patch('/kesemaptaan/instructors/{id}', [KesemaptaanController::class, 'updateInstructor']);
    Route::delete('/kesemaptaan/instructors/{id}', [KesemaptaanController::class, 'destroyInstructor']);
    Route::post('/kesemaptaan/achievements', [KesemaptaanController::class, 'storeAchievement']);
    Route::patch('/kesemaptaan/achievements/{id}', [KesemaptaanController::class, 'updateAchievement']);
    Route::delete('/kesemaptaan/achievements/{id}', [KesemaptaanController::class, 'destroyAchievement']);

    // Roles & Permissions
    Route::get('/roles', [RolePermissionController::class, 'roles']);
    Route::get('/permissions', [RolePermissionController::class, 'permissions']);
    Route::get('/roles/{roleId}/permissions', [RolePermissionController::class, 'rolePermissions']);
    Route::post('/roles/{roleId}/permissions', [RolePermissionController::class, 'syncRolePermissions']);

    // Account management (admin, guru, osis, siswa)
    Route::get('/accounts', [AccountController::class, 'index']);
    Route::post('/accounts', [AccountController::class, 'store']);
    Route::patch('/accounts/{id}', [AccountController::class, 'update']);
    Route::delete('/accounts/{id}', [AccountController::class, 'destroy']);
});
