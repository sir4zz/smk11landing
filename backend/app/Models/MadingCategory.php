<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MadingCategory extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    public $timestamps = false;
    protected $fillable = [
        'slug',
        'name',
        'sort_order',
        'created_at',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    public function posts(): HasMany
    {
        return $this->hasMany(MadingPost::class);
    }
}
