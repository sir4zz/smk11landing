<?php

namespace App\Models;

class SdmAssignment extends SdmChildModel
{
    public const JENIS_TUGAS_TAMBAHAN = 'tugas_tambahan';
    public const JENIS_TUGAS_MENGAJAR = 'tugas_mengajar';

    protected $fillable = [
        'id',
        'staff_type',
        'staff_id',
        'sort_order',
        'jenis',
        'uraian',
        'jumlah_jam',
    ];
}