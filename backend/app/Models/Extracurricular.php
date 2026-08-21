<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Extracurricular extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'slug',
        'logo',
        'category',
        'description',
        'short_description',
        'full_description',
        'photo',
        'advisor',
        'schedule',
        'place',
        'achievements',
        'documentation',
        'gallery',
        'status',
    ];

    protected $casts = [
        'achievements' => 'array',
        'documentation' => 'array',
        'gallery' => 'array',
    ];
}
