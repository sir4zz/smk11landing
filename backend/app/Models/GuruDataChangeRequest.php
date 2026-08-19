<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuruDataChangeRequest extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'guru_id',
        'old_data',
        'proposed_data',
        'status',
        'rejection_reason',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'old_data' => 'array',
        'proposed_data' => 'array',
        'verified_at' => 'datetime',
    ];

    public function guru(): BelongsTo
    {
        return $this->belongsTo(SdmGuru::class, 'guru_id');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
