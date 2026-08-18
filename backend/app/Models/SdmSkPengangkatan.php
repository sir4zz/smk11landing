<?php

namespace App\Models;

class SdmSkPengangkatan extends SdmChildModel
{
    public const KATEGORI_AWAL_SEKOLAH = 'awal_sekolah';
    public const KATEGORI_AKHIR_SEKOLAH = 'akhir_sekolah';
    public const KATEGORI_AWAL_DINDIKBUD = 'awal_dindikbud';
    public const KATEGORI_AKHIR_DINDIKBUD = 'akhir_dindikbud';

    protected $fillable = [
        'id',
        'staff_type',
        'staff_id',
        'sort_order',
        'kategori',
        'nomor_sk',
        'tanggal_sk',
        'pejabat',
    ];

    protected $casts = [
        'tanggal_sk' => 'date',
    ];
}