<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Program extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'slug',
        'short_name',
        'icon',
        'logo',
        'image',
        'description',
        'short_description',
        'competencies',
        'career_prospects',
        'facilities',
    ];

    protected $casts = [
        'competencies' => 'array',
        'career_prospects' => 'array',
        'facilities' => 'array',
    ];
}
