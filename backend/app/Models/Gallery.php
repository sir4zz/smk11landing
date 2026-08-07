<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Gallery extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'title',
        'slug',
        'description',
        'category',
        'event_date',
        'location',
        'cover_image',
        'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'event_date' => 'date',
    ];

    public function images(): HasMany
    {
        return $this->hasMany(GalleryImage::class)->orderBy('sort_order')->orderBy('created_at');
    }

    public function videos(): HasMany
    {
        return $this->hasMany(GalleryVideo::class)->orderBy('sort_order')->orderBy('created_at');
    }

    public function imagesCount(): int
    {
        return $this->images()->count();
    }
}
