<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Main Guru (pendidik) record from the SDM module. Independent of login
 * accounts: user_id is optional and links to the existing Guru account system
 * when a matching NIP/NUPTK account exists.
 */
class SdmGuru extends Model
{
    use HasUuids;

    public const STAFF_TYPE = 'guru';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'name',
        'nip',
        'nipppk',
        'nuptk',
        'gender',
        'religion',
        'birth_place',
        'birth_date',
        'status_kepegawaian',
        'pangkat_golongan',
        'jabatan',
        'tmt_golongan',
        'tmt_cpns',
        'tmt_pns_pppk',
        'tmt_sk_sekolah',
        'nik',
        'address',
        'phone',
        'npwp',
        'akta_lahir',
        'bpjs',
        'email',
        'instagram',
        'facebook',
        'twitter',
        'tiktok',
        'youtube',
        'linkedin',
        'website',
        'github',
        'photo',
        'bio',
        'is_active',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'tmt_golongan' => 'date',
        'tmt_cpns' => 'date',
        'tmt_pns_pppk' => 'date',
        'tmt_sk_sekolah' => 'date',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function educations(): HasMany
    {
        return $this->hasMany(SdmEducation::class, 'staff_id', 'id')
            ->where('staff_type', self::STAFF_TYPE)
            ->orderBy('sort_order')->orderBy('tahun_lulus');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(SdmAssignment::class, 'staff_id', 'id')
            ->where('staff_type', self::STAFF_TYPE)
            ->orderBy('sort_order');
    }

    public function certifications(): HasMany
    {
        return $this->hasMany(SdmCertification::class, 'staff_id', 'id')
            ->where('staff_type', self::STAFF_TYPE)
            ->orderBy('sort_order');
    }

    public function kgb(): HasOne
    {
        return $this->hasOne(SdmKgb::class, 'staff_id', 'id')->where('staff_type', self::STAFF_TYPE);
    }

    public function skPengangkatans(): HasMany
    {
        return $this->hasMany(SdmSkPengangkatan::class, 'staff_id', 'id')
            ->where('staff_type', self::STAFF_TYPE)
            ->orderBy('sort_order');
    }
}