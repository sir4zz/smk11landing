<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TeacherActivity extends Model
{
    use HasUuids;

    protected $table = 'teacher_activities';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'title',
        'date',
        'category',
        'description',
        'photo',
    ];

    protected $casts = [
        'date' => 'date',
    ];
}
