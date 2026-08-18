<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Shared child records for the SDM module (educations, assignments,
 * certifications, KGB, appointment SK). Rows belong to either a SdmGuru or a
 * SdmTendik via the (staff_type, staff_id) pair.
 */
abstract class SdmChildModel extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'staff_type',
        'staff_id',
        'sort_order',
    ];

    public function scopeForStaff($query, string $type, ?string $staffId = null)
    {
        $query->where('staff_type', $type);
        if ($staffId !== null) {
            $query->where('staff_id', $staffId);
        }

        return $query;
    }
}