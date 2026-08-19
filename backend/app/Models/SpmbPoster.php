<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        'published_at',
        'is_featured',
        'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}