<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MadingPost extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'title',
        'content',
        'category_id',
        'author_id',
        'author_name',
        'author_role',
        'cover_image',
        'images',
        'videos',
        'status',
        'feedback',
        'published_at',
        'ai_assisted',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'ai_assisted' => 'boolean',
        'images' => 'array',
        'videos' => 'array',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(MadingCategory::class, 'category_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(MadingReview::class);
    }
}
