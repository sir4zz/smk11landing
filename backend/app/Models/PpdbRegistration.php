<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PpdbRegistration extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'user_id',
        'registration_number',
        'full_name',
        'nisn',
        'nik',
        'gender',
        'place_of_birth',
        'date_of_birth',
        'religion',
        'address',
        'phone',
        'father_name',
        'father_occupation',
        'mother_name',
        'mother_occupation',
        'guardian_name',
        'guardian_phone',
        'parent_address',
        'previous_school',
        'previous_school_address',
        'graduation_year',
        'program',
        'documents_count',
        'status',
        'admin_note',
        'submitted_at',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'documents_count' => 'integer',
        'submitted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(PpdbDocument::class, 'application_id');
    }

    public function activityLog(): HasMany
    {
        return $this->hasMany(PpdbActivityLog::class, 'application_id');
    }
}
