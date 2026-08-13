<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AlumniGraduation extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'nisn',
        'major',
        'graduation_year',
        'phone',
        'email',
        'domicile',
        'status',
        'status_detail',
        'verification_status',
        'verification_note',
        'submitted_by',
    ];

    protected $casts = [
        'graduation_year' => 'integer',
        'status_detail' => 'json',
    ];
}
