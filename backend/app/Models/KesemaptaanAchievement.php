<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class KesemaptaanAchievement extends Model
{
    use HasUuids;

    protected $table = 'kesemaptaan_achievements';

    public $incrementing = false;
    protected $keyType = 'string';

    public $timestamps = false;
    protected $fillable = [
        'name',
        'year',
        'description',
        'documentation',
        'created_at',
    ];

    protected $casts = [
        'documentation' => 'array',
    ];
}
