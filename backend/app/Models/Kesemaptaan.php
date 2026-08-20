<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Kesemaptaan extends Model
{
    use HasUuids;

    protected $table = 'kesemaptaan';

    public $incrementing = false;
    protected $keyType = 'string';

    public $timestamps = false;
    protected $fillable = [
        'title',
        'description',
        'photo',
        'hero_title',
        'hero_description',
        'hero_image',
        'about_title',
        'about_description',
        'goals',
        'updated_at',
        'created_at',
    ];

    protected $casts = [
        'updated_at' => 'datetime',
        'created_at' => 'datetime',
        'goals' => 'array',
    ];
}