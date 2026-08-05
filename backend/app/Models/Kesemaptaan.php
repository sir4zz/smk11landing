<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Kesemaptaan extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    public $timestamps = false;
    protected $fillable = [
        'title',
        'description',
        'photo',
        'updated_at',
    ];

    protected $casts = [
        'updated_at' => 'datetime',
    ];
}
