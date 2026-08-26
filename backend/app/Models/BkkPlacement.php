<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BkkPlacement extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'year',
        'month',
        'school_name',
        'alumni_name',
        'gender',
        'birth_place',
        'birth_date',
        'nik',
        'ak1_no',
        'address',
        'district',
        'province',
        'regency',
        'email',
        'major',
        'position',
        'status',
        'company_name',
        'company_business_type',
        'business_field',
        'company_address',
        'company_province',
        'company_regency',
    ];

    protected $casts = [
        'year' => 'integer',
    ];
}
