<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Achievement extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'title',
        'event',
        'year',
        'level',
        'rank',
        'students',
        'photo',
    ];

    protected $casts = [
        'year' => 'integer',
        'students' => 'array',
    ];
}
