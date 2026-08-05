<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class News extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'title',
        'slug',
        'date',
        'excerpt',
        'content',
        'thumbnail',
        'category',
        'author',
        'source_type',
        'source_label',
        'source_note',
        'source_url',
    ];

    protected $casts = [
        'date' => 'date',
    ];
}
