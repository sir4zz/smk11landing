<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class KesemaptaanVideo extends Model
{
    use HasUuids;

    protected $table = 'kesemaptaan_videos';

    public $incrementing = false;
    protected $keyType = 'string';

    public $timestamps = false;
    protected $fillable = [
        'youtube_url',
        'title',
        'sort_order',
        'created_at',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];
}