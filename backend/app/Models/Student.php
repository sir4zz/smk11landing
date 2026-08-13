<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Student extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'nisn',
        'nis',
        'pin',
        'name',
        'class',
        'major',
        'gender',
        'date_of_birth',
        'place_of_birth',
        'religion',
        'address',
        'achievements',
        // Section 1 — Ket Peserta Didik
        'nickname',
        'kewarganegaraan',
        'anak_ke',
        'jml_saudara_kandung',
        'jml_saudara_tiri',
        'anak_yatim_piatu',
        'bahasa_sehari_hari',
        // Section 2 — Tempat Tinggal
        'phone',
        'tinggal_dengan',
        'jarak_sekolah',
        // Section 3 — Kesehatan
        'golongan_darah',
        'penyakit',
        'kelainan_jasmani',
        'tinggi_cm',
        'berat_kg',
        // Section 4 — Pendidikan
        'lulusan_dari',
        'tanggal_sttb',
        'nomor_sttb',
        'lama_belajar',
        'pindahan_dari',
        'alasan_pindah',
        'diangkat',
        'kompetensi_keahlian',
        'tanggal_diterima',
        // Section 5-7 — Ayah / Ibu / Wali
        'ayah_nama', 'ayah_tempat', 'ayah_tanggal_lahir', 'ayah_agama', 'ayah_kewarganegaraan',
        'ayah_pendidikan', 'ayah_pekerjaan', 'ayah_penghasilan', 'ayah_alamat', 'ayah_no_telp', 'ayah_status_hidup',
        'ibu_nama', 'ibu_tempat', 'ibu_tanggal_lahir', 'ibu_agama', 'ibu_kewarganegaraan',
        'ibu_pendidikan', 'ibu_pekerjaan', 'ibu_penghasilan', 'ibu_alamat', 'ibu_no_telp', 'ibu_status_hidup',
        'wali_nama', 'wali_tempat', 'wali_tanggal_lahir', 'wali_agama', 'wali_kewarganegaraan',
        'wali_pendidikan', 'wali_pekerjaan', 'wali_penghasilan', 'wali_alamat', 'wali_no_telp', 'wali_status_hidup',
        // Section 8 — Kegemaran
        'gemar_kesenian', 'gemar_olahraga', 'gemar_kemasyarakatan', 'gemar_lain',
        // Section 9 — Perkembangan
        'beasiswa_tk', 'beasiswa_dari',
        // Section 10 — Ket Siswa
        'siswa_status', 'siswa_tanggal',
    ];

    protected $casts = [
        'achievements' => 'array',
        'date_of_birth' => 'date',
        'tanggal_sttb' => 'date',
        'tanggal_diterima' => 'date',
        'siswa_tanggal' => 'date',
        'ayah_tanggal_lahir' => 'date',
        'ibu_tanggal_lahir' => 'date',
        'wali_tanggal_lahir' => 'date',
        'jarak_sekolah' => 'decimal:2',
    ];

    public function account(): HasOne
    {
        return $this->hasOne(StudentAccount::class, 'student_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id', 'id');
    }
}
