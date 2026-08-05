<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'name',
        'email',
        'subject',
        'message',
        'is_read',
        'created_at',
    ];

    protected $casts = [
        'is_read' => 'integer',
        'created_at' => 'datetime',
    ];

    protected $appends = ['isRead'];

    public function getIsReadAttribute()
    {
        return (int) $this->attributes['is_read'] ?? 0;
    }
}
