<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class KesemaptaanSchedule extends Model
{
    use HasUuids;

    protected $table = 'kesemaptaan_schedules';

    public $incrementing = false;
    protected $keyType = 'string';

    public $timestamps = false;
    protected $fillable = [
        'day',
        'time',
        'place',
        'created_at',
    ];
}
