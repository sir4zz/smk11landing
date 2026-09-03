<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Student extends Model
{
    use HasUuids;

    public const CLASSES = ['10', '11', '12', 'X', 'XI', 'XII'];

    public static function isValidClass(mixed $value): bool
    {
        return in_array(self::normalizeClass($value), self::CLASSES, true);
    }

    public static function normalizeClass(mixed $value): string
    {
        $v = strtoupper(trim((string) $value));
        return match ($v) {
            '10', 'X' => '10',
            '11', 'XI' => '11',
            '12', 'XII' => '12',
            default => $v,
        };
    }

    public const BIODATA_KEYS = [
        // Section 1
        'nickname', 'kewarganegaraan', 'anak_ke', 'jml_saudara_kandung', 'jml_saudara_tiri',
        'anak_yatim_piatu', 'bahasa_sehari_hari',
        // Section 2
        'provinsi', 'kota', 'kecamatan', 'phone', 'tinggal_dengan', 'jarak_sekolah',
        // Section 3
        'golongan_darah', 'penyakit', 'kelainan_jasmani', 'tinggi_cm', 'berat_kg',
        // Section 4
        'lulusan_dari', 'tanggal_sttb', 'nomor_sttb', 'lama_belajar', 'pindahan_dari',
        'alasan_pindah', 'diangkat', 'kompetensi_keahlian', 'tanggal_diterima',
        // Sections 5-7
        'ayah_nama', 'ayah_tempat', 'ayah_tanggal_lahir', 'ayah_agama', 'ayah_kewarganegaraan',
        'ayah_pendidikan', 'ayah_pekerjaan', 'ayah_penghasilan', 'ayah_alamat', 'ayah_no_telp', 'ayah_status_hidup',
        'ibu_nama', 'ibu_tempat', 'ibu_tanggal_lahir', 'ibu_agama', 'ibu_kewarganegaraan',
        'ibu_pendidikan', 'ibu_pekerjaan', 'ibu_penghasilan', 'ibu_alamat', 'ibu_no_telp', 'ibu_status_hidup',
        'wali_nama', 'wali_tempat', 'wali_tanggal_lahir', 'wali_agama', 'wali_kewarganegaraan',
        'wali_pendidikan', 'wali_pekerjaan', 'wali_penghasilan', 'wali_alamat', 'wali_no_telp', 'wali_status_hidup',
        // Sections 8-9
        'gemar_kesenian', 'gemar_olahraga', 'gemar_kemasyarakatan', 'gemar_lain',
        'siswa_status', 'siswa_tanggal',
    ];

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
        'foto',
        'doc_kk',
        'doc_akta',
        'doc_ijazah',
        'doc_lainnya',
        ...self::BIODATA_KEYS,
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
        'jarak_sekolah' => 'float',
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
