<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SpmbPoster extends Model
{
    use HasUuids;

    protected $table = 'spmb_posters';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'title',
        'image',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}