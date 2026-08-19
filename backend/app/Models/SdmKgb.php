<?php

namespace App\Models;

class SdmKgb extends SdmChildModel
{
    protected $table = 'sdm_kgb';

    protected $fillable = [
        'id',
        'staff_type',
        'staff_id',
        'sort_order',
        'no_sk',
        'tanggal_sk',
        'gaji_pokok',
        'mkg',
        'tmt_kgb_akhir',
        'tmt_kgb_berikutnya',
    ];

    protected $casts = [
        'tanggal_sk' => 'date',
        'tmt_kgb_akhir' => 'date',
        'tmt_kgb_berikutnya' => 'date',
    ];
}