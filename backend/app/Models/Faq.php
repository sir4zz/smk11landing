<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Faq extends Model
{
    use HasUuids;

    protected $table = 'faqs';

    public $incrementing = false;
    protected $keyType = 'string';

    public $timestamps = false;
    protected $fillable = [
        'question',
        'answer',
        'category',
        'sort_order',
        'created_at',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];
}
