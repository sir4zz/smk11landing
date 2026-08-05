<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Student extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'nisn',
        'name',
        'class',
        'major',
    ];

    public function account(): HasOne
    {
        return $this->hasOne(StudentAccount::class, 'student_id');
    }
}
