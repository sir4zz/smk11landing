<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Profile extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'role',
        'name',
        'phone',
        'email',
        'photo',
        'bio',
        'address',
        'instagram',
        'facebook',
        'twitter',
        'tiktok',
        'youtube',
        'linkedin',
        'website',
        'github',
        'status',
        'must_change_password',
        'updated_at',
    ];

    protected $casts = [
        'updated_at' => 'datetime',
        'must_change_password' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id', 'id');
    }
}
