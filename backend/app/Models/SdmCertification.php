<?php

namespace App\Models;

class SdmCertification extends SdmChildModel
{
    protected $fillable = [
        'id',
        'staff_type',
        'staff_id',
        'sort_order',
        'status',
        'no_sertifikat',
        'no_peserta',
        'no_nrg',
        'bidang_studi',
        'penyelenggara',
        'tahun_lulus',
    ];

    protected $casts = [
        'tahun_lulus' => 'integer',
    ];
}