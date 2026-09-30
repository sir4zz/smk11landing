<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Guru/tendik tidak lagi wajib ganti password saat login pertama.
     * Bersihkan flag yang terlanjur tersimpan pada akun yang terhubung
     * ke data SDM (akun baru sudah dibuat dengan flag false).
     */
    public function up(): void
    {
        DB::table('profiles')
            ->whereIn('id', function ($query) {
                $query->select('user_id')->from('sdm_gurus')->whereNotNull('user_id');
            })
            ->orWhereIn('id', function ($query) {
                $query->select('user_id')->from('sdm_tendiks')->whereNotNull('user_id');
            })
            ->update(['must_change_password' => false]);
    }

    public function down(): void
    {
        // Data update is intentionally not reversed.
    }
};
