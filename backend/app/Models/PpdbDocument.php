<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PpdbDocument extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    public $timestamps = false;
    protected $fillable = [
        'application_id',
        'type',
        'filename',
        'file_path',
        'mime_type',
        'file_size',
        'verified',
        'note',
        'created_at',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'verified' => 'integer',
        'created_at' => 'datetime',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(PpdbRegistration::class, 'application_id');
    }
}
