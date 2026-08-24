<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SpmbContent extends Model
{
    use HasUuids;

    protected $table = 'spmb_content';

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'status',
        'title',
        'description',
        'latest_info',
        'requirements',
        'schedule',
        'flow_steps',
        'faq',
        'portal_url',
        'banner_image',
        'banner_title',
        'banner_description',
        'pdf_attachment',
        'pdf_attachments',
    ];

    protected $casts = [
        'requirements' => 'array',
        'schedule' => 'array',
        'flow_steps' => 'array',
        'faq' => 'array',
        'pdf_attachments' => 'array',
    ];
}
