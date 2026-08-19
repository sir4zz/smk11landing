<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class KesemaptaanActivity extends Model
{
    use HasUuids;

    protected $table = 'kesemaptaan_activities';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'title',
        'description',
        'activity_date',
        'documentation',
        'photo',
        'status',
    ];

    protected $casts = [
        'activity_date' => 'date',
        'documentation' => 'array',
    ];
}
