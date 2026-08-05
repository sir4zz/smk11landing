<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MadingReview extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    public $timestamps = false;
    protected $fillable = [
        'post_id',
        'reviewer_id',
        'reviewer_name',
        'action',
        'feedback',
        'created_at',
    ];

    public function post(): BelongsTo
    {
        return $this->belongsTo(MadingPost::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
