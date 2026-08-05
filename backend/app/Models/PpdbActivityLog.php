<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PpdbActivityLog extends Model
{
    use HasUuids;

    protected $table = 'ppdb_activity_log';

    public $incrementing = false;
    protected $keyType = 'string';

    public $timestamps = false;
    protected $fillable = [
        'application_id',
        'action',
        'note',
        'created_at',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(PpdbRegistration::class, 'application_id');
    }
}
