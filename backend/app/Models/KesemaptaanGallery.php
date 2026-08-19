<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class KesemaptaanGallery extends Model
{
    use HasUuids;

    protected $table = 'kesemaptaan_gallery';

    public $incrementing = false;
    protected $keyType = 'string';

    public $timestamps = false;
    protected $fillable = [
        'image',
        'caption',
        'is_primary',
        'sort_order',
        'created_at',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'sort_order' => 'integer',
    ];
}