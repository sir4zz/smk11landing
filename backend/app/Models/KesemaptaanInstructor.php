<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class KesemaptaanInstructor extends Model
{
    use HasUuids;

    protected $table = 'kesemaptaan_instructors';

    public $incrementing = false;
    protected $keyType = 'string';

    public $timestamps = false;
    protected $fillable = [
        'name',
        'role',
        'photo',
        'sort_order',
        'created_at',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];
}
