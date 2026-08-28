<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Facility extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'category',
        'photo',
    ];

    protected static function booted(): void
    {
        static::creating(function (Facility $facility) {
            if (empty($facility->slug) && ! empty($facility->name)) {
                $facility->slug = static::uniqueSlug($facility->name);
            }
        });

        static::updating(function (Facility $facility) {
            if (empty($facility->slug) && ! empty($facility->name)) {
                $facility->slug = static::uniqueSlug($facility->name, $facility->id);
            }
        });
    }

    protected static function uniqueSlug(string $name, ?string $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'fasilitas';
        $slug = $base;
        $i = 2;
        while (static::query()->where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = $base . '-' . $i;
            $i++;
        }

        return $slug;
    }
}
