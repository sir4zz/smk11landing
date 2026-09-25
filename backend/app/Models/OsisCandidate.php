<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OsisCandidate extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'election_id',
        'number',
        'name',
        'class',
        'wakil_name',
        'wakil_class',
        'vision',
        'mission',
        'photo',
        'wakil_photo',
        'banner_photo',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'number' => 'integer',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];

    public function election(): BelongsTo
    {
        return $this->belongsTo(OsisElection::class, 'election_id');
    }

    public function votes(): HasMany
    {
        return $this->hasMany(OsisVote::class, 'candidate_id');
    }
}
