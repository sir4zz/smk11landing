<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Student extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'nisn',
        'pin',
        'name',
        'class',
        'major',
        'gender',
        'date_of_birth',
        'place_of_birth',
        'address',
        'achievements',
    ];

    protected $casts = [
        'achievements' => 'array',
        'date_of_birth' => 'date',
    ];

    public function account(): HasOne
    {
        return $this->hasOne(StudentAccount::class, 'student_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id', 'id');
    }
}
