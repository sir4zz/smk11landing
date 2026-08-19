<?php

namespace App\Models;

class SdmEducation extends SdmChildModel
{
    protected $table = 'sdm_educations';

    protected $fillable = [
        'id',
        'staff_type',
        'staff_id',
        'sort_order',
        'jenjang',
        'jurusan',
        'perguruan_tinggi',
        'tahun_lulus',
        'tempat',
        'nomor_ijazah',
        'tanggal_ijazah',
    ];

    protected $casts = [
        'tahun_lulus' => 'integer',
        'tanggal_ijazah' => 'date',
    ];
}