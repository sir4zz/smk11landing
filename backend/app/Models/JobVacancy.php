<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class JobVacancy extends Model
{
    use HasUuids;

    public const STATUS_OPEN = 'open';
    public const STATUS_CLOSING = 'closing';
    public const STATUS_CLOSED = 'closed';

    public const TYPE_FULL_TIME = 'full_time';
    public const TYPE_CONTRACT = 'contract';
    public const TYPE_INTERNSHIP = 'internship';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'company_name',
        'company_logo',
        'position',
        'slug',
        'company_description',
        'job_description',
        'responsibilities',
        'requirements',
        'benefits',
        'education',
        'experience',
        'major',
        'city',
        'location',
        'employment_type',
        'registration_link',
        'hr_contact',
        'deadline',
        'status',
        'is_published',
    ];

    protected $casts = [
        'deadline' => 'date',
        'is_published' => 'boolean',
    ];
}