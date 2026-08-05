<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EducationStaff extends Model
{
    use HasUuids;

    protected $table = 'education_staff';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'position',
        'department',
        'photo',
    ];
}
