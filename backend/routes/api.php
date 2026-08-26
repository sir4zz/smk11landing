<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AlumniGraduationController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\StudentAuthController;
use App\Http\Controllers\BkkPartnerController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\ContentCrudController;
use App\Http\Controllers\DatabaseBackupController;
use App\Http\Controllers\WhatsAppAdminController;
use App\Http\Controllers\ExtracurricularController;
use App\Http\Controllers\FaqController;
use App\Http\Controllers\MadingAiController;
use App\Http\Controllers\MadingController;
use App\Http\Controllers\MyProfileController;
use App\Http\Controllers\OsisController;
use App\Http\Controllers\PpdbController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\GuruDataChangeRequestController;
use App\Http\Controllers\JobVacancyController;
use App\Http\Controllers\ProxyController;
use App\Http\Controllers\PublicProfileController;
use App\Http\Controllers\RolePermissionController;
use App\Http\Controllers\SdmAccountController;
use App\Http\Controllers\SdmController;
use App\Http\Controllers\SpmbController;
use App\Http\Controllers\AIContentUploadController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\StudentDataChangeRequestController;
use App\Http\Controllers\PageBannerController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\DataController;
use App\Http\Controllers\MediaController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ---------- AUTH ----------
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:auth');
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:auth');
Route::post('/auth/logout', [AuthController::class, 'logout']);
Route::get('/auth/me', [AuthController::class, 'me']);
Route::get('/auth/permissions', [AuthController::class, 'permissions']);
Route::post('/auth/student-email', [StudentAuthController::class, 'studentEmail']);

// ---------- PUBLIC PROFILES ----------
Route::get('/public/directory', [PublicProfileController::class, 'directory']);
Route::get('/public/leadership', [PublicProfileController::class, 'leadership']);
Route::get('/public/guru/{identifier}', [PublicProfileController::class, 'guru']);
Route::get('/public/siswa/{identifier}', [PublicProfileController::class, 'siswa']);
Route::get('/public/osis/{identifier}', [PublicProfileController::class, 'osis']);
Route::get('/public/tendik/{identifier}', [PublicProfileController::class, 'tendik']);

// ---------- PROFILES ----------
Route::get('/profiles/{id}', [ProfileController::class, 'show']);
Route::patch('/profiles/{id}', [ProfileController::class, 'update']);

// ---------- MEDIA ----------
Route::get('/media', [MediaController::class, 'index']);

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
Route::get('/spmb/posters', [SpmbController::class, 'posters']);

// ---------- OSIS ----------
Route::get('/osis', [OsisController::class, 'profile']);
Route::get('/osis/members', [OsisController::class, 'members']);
Route::get('/osis/activities', [OsisController::class, 'activities']);

// ---------- EXTRACURRICULARS ----------
Route::get('/extracurriculars', [ExtracurricularController::class, 'index']);
Route::get('/extracurriculars/{slug}', [ExtracurricularController::class, 'show']);

// ---------- MADING ----------
Route::get('/mading/categories', [MadingController::class, 'categories']);
Route::get('/mading/posts', [MadingController::class, 'index']);
Route::get('/mading/posts/{id}', [MadingController::class, 'show']);

// ---------- STATS ----------
Route::get('/stats', [StatsController::class, 'index']);

// ---------- FAQ ----------
Route::get('/faqs', [FaqController::class, 'index']);

// ---------- PAGE BANNERS ----------
Route::get('/page-banners', [PageBannerController::class, 'index']);
Route::get('/page-banners/{pageKey}', [PageBannerController::class, 'show']);

// ---------- CONTACT ----------
Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:contact');

// ---------- GALLERY ----------
Route::get('/galleries', [GalleryController::class, 'index']);
Route::get('/gallery/categories', [GalleryController::class, 'categories']);
Route::get('/galleries/{slug}', [GalleryController::class, 'show']);
Route::get('/uploads/url', [UploadController::class, 'url'])->middleware('auth:sanctum');
Route::delete('/uploads', [UploadController::class, 'destroy'])->middleware('auth:sanctum');

// ---------- BKK / JOB VACANCIES ----------
Route::get('/jobs', [JobVacancyController::class, 'index']);
Route::get('/jobs/{slug}', [JobVacancyController::class, 'show']);
Route::get('/bkk/partners', [BkkPartnerController::class, 'index']);

// ---------- KELULUSAN SISWA (public form) ----------
Route::post('/kelulusan', [AlumniGraduationController::class, 'store']);

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
    // Self-service profile management
    Route::get('/me', [MyProfileController::class, 'show']);
    Route::patch('/me/profile', [MyProfileController::class, 'updateProfile']);
    Route::patch('/me/password', [MyProfileController::class, 'updatePassword']);

    // Mading workflow
    Route::post('/mading/posts', [MadingController::class, 'store']);
    Route::patch('/mading/posts/{id}', [MadingController::class, 'update']);
    Route::delete('/mading/posts/{id}', [MadingController::class, 'destroy']);
    Route::post('/mading/posts/{id}/submit', [MadingController::class, 'submit']);
    Route::post('/mading/posts/{id}/review', [MadingController::class, 'review']);
    Route::post('/mading/posts/{id}/publish', [MadingController::class, 'publish']);

    // Mading AI Content Assistant. Access: students by default; staff must have
    // the mading.ai_generate permission (checked inside the controller).
    Route::middleware('throttle:mading-ai')->group(function () {
        Route::post('/mading/ai/generate', [MadingAiController::class, 'generate']);
        Route::post('/mading/ai/improve', [MadingAiController::class, 'improve']);
        Route::post('/mading/ai/shorten', [MadingAiController::class, 'shorten']);
        Route::post('/mading/ai/expand', [MadingAiController::class, 'expand']);
        Route::post('/mading/ai/change-style', [MadingAiController::class, 'changeStyle']);
        Route::post('/mading/ai/generate-ideas', [MadingAiController::class, 'generateIdeas']);
    });

    // Upload
    Route::post('/upload', [UploadController::class, 'upload'])->middleware('throttle:upload');

    // Student: own data & change requests
    Route::get('/student/data-siswa', [StudentDataChangeRequestController::class, 'myData']);
    Route::get('/student/data-siswa/change-requests', [StudentDataChangeRequestController::class, 'myRequests']);
    Route::post('/student/data-siswa/change-requests', [StudentDataChangeRequestController::class, 'store']);
    Route::delete('/student/data-siswa/change-requests/{id}', [StudentDataChangeRequestController::class, 'cancel']);

    // Guru: own SDM data & change requests
    Route::get('/guru/data-saya', [GuruDataChangeRequestController::class, 'myData']);
    Route::get('/guru/data-saya/change-requests', [GuruDataChangeRequestController::class, 'myRequests']);
    Route::post('/guru/data-saya/change-requests', [GuruDataChangeRequestController::class, 'store']);
    Route::delete('/guru/data-saya/change-requests/{id}', [GuruDataChangeRequestController::class, 'cancel']);
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
    Route::post('/admin/students/import', [StudentController::class, 'import'])->middleware('permission:mading.edit_all');
    Route::post('/admin/students/{studentId}/reset-pin', [StudentController::class, 'resetPin'])->middleware('permission:mading.edit_all');
    Route::delete('/admin/students/{studentId}', [StudentController::class, 'destroy'])->middleware('permission:mading.edit_all');
    Route::get('/admin/students/files/download', [StudentController::class, 'downloadFile'])->middleware('permission:mading.edit_all');

    // Gallery management
    Route::get('/admin/galleries', [GalleryController::class, 'adminIndex'])->middleware('permission:gallery.view');
    Route::post('/admin/galleries', [GalleryController::class, 'store'])->middleware('permission:gallery.create');
    Route::patch('/admin/galleries/{id}', [GalleryController::class, 'update'])->middleware('permission:gallery.edit');
    Route::delete('/admin/galleries/{id}', [GalleryController::class, 'destroy'])->middleware('permission:gallery.delete');
    Route::post('/admin/galleries/{id}/images', [GalleryController::class, 'storeImages'])->middleware('permission:gallery.edit');
    Route::delete('/admin/gallery-images/{id}', [GalleryController::class, 'destroyImage'])->middleware('permission:gallery.edit');
    Route::put('/admin/gallery-images/reorder', [GalleryController::class, 'reorderImages'])->middleware('permission:gallery.edit');
    Route::post('/admin/galleries/{id}/videos', [GalleryController::class, 'storeVideos'])->middleware('permission:gallery.edit');
    Route::delete('/admin/gallery-videos/{id}', [GalleryController::class, 'destroyVideo'])->middleware('permission:gallery.edit');
    Route::put('/admin/gallery-videos/reorder', [GalleryController::class, 'reorderVideos'])->middleware('permission:gallery.edit');

    // Contact messages (admin only in the UI, but keep staff-readable list)
    Route::get('/contact', [ContactController::class, 'index'])->middleware('admin');
    Route::patch('/contact/{id}/read', [ContactController::class, 'markRead'])->middleware('admin');
    Route::delete('/contact/{id}', [ContactController::class, 'destroy'])->middleware('admin');

    // BKK / Job vacancy management
    Route::get('/admin/jobs', [JobVacancyController::class, 'adminIndex'])->middleware('permission:job.view');
    Route::post('/admin/jobs', [JobVacancyController::class, 'store'])->middleware('permission:job.create');
    Route::put('/admin/jobs/{id}', [JobVacancyController::class, 'update'])->middleware('permission:job.edit');
    Route::delete('/admin/jobs/{id}', [JobVacancyController::class, 'destroy'])->middleware('permission:job.delete');

    // BKK / Partner company management
    Route::get('/admin/bkk/partners', [BkkPartnerController::class, 'adminIndex'])->middleware('permission:job.view');
    Route::post('/admin/bkk/partners', [BkkPartnerController::class, 'store'])->middleware('permission:job.create');
    Route::put('/admin/bkk/partners/{id}', [BkkPartnerController::class, 'update'])->middleware('permission:job.edit');
    Route::delete('/admin/bkk/partners/{id}', [BkkPartnerController::class, 'destroy'])->middleware('permission:job.delete');

    // KELULUSAN SISWA (Alumni Graduation)
    Route::get('/admin/kelulusan', [AlumniGraduationController::class, 'adminIndex'])->middleware('permission:job.view');
    Route::get('/admin/kelulusan/stats', [AlumniGraduationController::class, 'stats'])->middleware('permission:job.view');
    Route::get('/admin/kelulusan/export', [AlumniGraduationController::class, 'export'])->middleware('permission:job.view');
    Route::get('/admin/kelulusan/{id}', [AlumniGraduationController::class, 'show'])->middleware('permission:job.view');
    Route::post('/admin/kelulusan', [AlumniGraduationController::class, 'store'])->middleware('permission:job.create');
    Route::put('/admin/kelulusan/{id}', [AlumniGraduationController::class, 'update'])->middleware('permission:job.edit');
    Route::patch('/admin/kelulusan/{id}', [AlumniGraduationController::class, 'update'])->middleware('permission:job.edit');
    Route::delete('/admin/kelulusan/{id}', [AlumniGraduationController::class, 'destroy'])->middleware('permission:job.delete');
    Route::patch('/admin/kelulusan/{id}/verify', [AlumniGraduationController::class, 'verify'])->middleware('permission:job.edit');

    // Student data change request verification (operator_sekolah)
    Route::get('/admin/student-change-requests', [StudentDataChangeRequestController::class, 'adminIndex'])->middleware('permission:mading.edit_all');
    Route::get('/admin/student-change-requests/{id}', [StudentDataChangeRequestController::class, 'adminShow'])->middleware('permission:mading.edit_all');
    Route::patch('/admin/student-change-requests/{id}/verify', [StudentDataChangeRequestController::class, 'verify'])->middleware('permission:mading.edit_all');

    // SDM (Guru & Tenaga Kependidikan) management
    Route::get('/admin/sdm/{type}', [SdmController::class, 'index'])->where('type', 'guru|tendik')->middleware('permission:sdm.view');
    Route::post('/admin/sdm/{type}', [SdmController::class, 'store'])->where('type', 'guru|tendik')->middleware('permission:sdm.create');
    Route::post('/admin/sdm/{type}/preview', [SdmController::class, 'preview'])->where('type', 'guru|tendik')->middleware('permission:sdm.import');
    Route::post('/admin/sdm/{type}/import', [SdmController::class, 'import'])->where('type', 'guru|tendik')->middleware('permission:sdm.import');
    Route::get('/admin/sdm/{type}/export', [SdmController::class, 'export'])->where('type', 'guru|tendik')->middleware('permission:sdm.export');
    Route::get('/admin/sdm/{type}/{id}', [SdmController::class, 'show'])->where('type', 'guru|tendik')->middleware('permission:sdm.view');
    Route::patch('/admin/sdm/{type}/{id}', [SdmController::class, 'update'])->where('type', 'guru|tendik')->middleware('permission:sdm.edit');
    Route::delete('/admin/sdm/{type}/{id}', [SdmController::class, 'destroy'])->where('type', 'guru|tendik')->middleware('permission:sdm.delete');

    // SDM guru login accounts (create / reset / enable-disable / unlink)
    Route::get('/admin/sdm/guru/{id}/account', [SdmAccountController::class, 'show'])->middleware('permission:sdm.view');
    Route::post('/admin/sdm/guru/{id}/account', [SdmAccountController::class, 'store'])->middleware('permission:sdm.edit');
    Route::patch('/admin/sdm/guru/{id}/account', [SdmAccountController::class, 'update'])->middleware('permission:sdm.edit');
    Route::delete('/admin/sdm/guru/{id}/account', [SdmAccountController::class, 'destroy'])->middleware('permission:sdm.edit');

    // Guru data change request verification (operator_sekolah)
    Route::get('/admin/guru-change-requests', [GuruDataChangeRequestController::class, 'adminIndex'])->middleware('permission:sdm.view');
    Route::get('/admin/guru-change-requests/{id}', [GuruDataChangeRequestController::class, 'adminShow'])->middleware('permission:sdm.view');
    Route::patch('/admin/guru-change-requests/{id}/verify', [GuruDataChangeRequestController::class, 'verify'])->middleware('permission:sdm.edit');

    // SPMB announcements (posters) management — Admin & Operator Sekolah
    Route::get('/admin/spmb/posters', [SpmbController::class, 'adminPosters'])->middleware('permission:spmb.view');
    Route::post('/admin/spmb/posters', [SpmbController::class, 'storePoster'])->middleware('permission:spmb.create');
    Route::post('/admin/spmb/posters/upload', [SpmbController::class, 'uploadPoster'])->middleware('permission:spmb.edit');
    Route::post('/admin/spmb/pdf/upload', [SpmbController::class, 'uploadPdf'])->middleware('permission:spmb.edit');
    Route::patch('/admin/spmb/posters/{id}', [SpmbController::class, 'updatePoster'])->middleware('permission:spmb.edit');
    Route::delete('/admin/spmb/posters/{id}', [SpmbController::class, 'destroyPoster'])->middleware('permission:spmb.delete');

    // Page Banners management
    Route::get('/admin/page-banners', [PageBannerController::class, 'adminIndex']);
    Route::post('/admin/page-banners', [PageBannerController::class, 'store']);
    Route::put('/admin/page-banners/{id}', [PageBannerController::class, 'update']);
    Route::delete('/admin/page-banners/{id}', [PageBannerController::class, 'destroy']);

    // AI Content Upload
    Route::post('/admin/ai-content-upload/analyze', [AIContentUploadController::class, 'analyze'])->middleware('throttle:mading-ai');
    Route::post('/admin/ai-content-upload/save', [AIContentUploadController::class, 'save']);

    // Media inventory
    Route::get('/admin/media', [MediaController::class, 'index']);
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

    // News URL importer (fetches remote article pages server-side to avoid CORS)
    Route::get('/proxy/fetch', [ProxyController::class, 'fetch'])->middleware('throttle:proxy');

    // SPMB (portal settings stay admin-only)
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

    // Roles & Permissions
    Route::get('/roles', [RolePermissionController::class, 'roles']);
    Route::get('/permissions', [RolePermissionController::class, 'permissions']);
    Route::get('/roles/{roleId}/permissions', [RolePermissionController::class, 'rolePermissions']);
    Route::post('/roles/{roleId}/permissions', [RolePermissionController::class, 'syncRolePermissions']);

    // Account management (admin, guru, osis, siswa)
    Route::post('/accounts/import', [StudentController::class, 'import'])->middleware('permission:mading.edit_all');
    Route::get('/accounts', [AccountController::class, 'index']);
    Route::post('/accounts', [AccountController::class, 'store']);
    Route::patch('/accounts/{id}', [AccountController::class, 'update']);
    Route::delete('/accounts/{id}', [AccountController::class, 'destroy']);

    // Backup / Restore (full system: database + media)
    Route::get('/backups', [DatabaseBackupController::class, 'index']);
    Route::post('/backups', [DatabaseBackupController::class, 'store']);
    Route::post('/backups/restore', [DatabaseBackupController::class, 'restore']);
    Route::post('/backups/restore-chunk', [DatabaseBackupController::class, 'uploadChunk']);
    Route::post('/backups/restore-commit', [DatabaseBackupController::class, 'restoreCommit']);
    Route::get('/backups/{filename}', [DatabaseBackupController::class, 'download']);
    Route::delete('/backups/{filename}', [DatabaseBackupController::class, 'destroy']);

    // WhatsApp (Baileys) session management
    Route::get('/whatsapp/status', [WhatsAppAdminController::class, 'status']);
    Route::get('/whatsapp/qr', [WhatsAppAdminController::class, 'qr']);
    Route::post('/whatsapp/logout', [WhatsAppAdminController::class, 'logout']);
});
