<?php

namespace Database\Seeders;

use App\Models\Sop;
use Illuminate\Database\Seeder;

class SopDummySeeder extends Seeder
{
    public function run(): void
    {
        $documents = [
            ['title' => 'SOP Pelaksanaan Kegiatan Belajar Mengajar', 'slug' => 'sop-pelaksanaan-kbm', 'description' => 'Pedoman pelaksanaan kegiatan belajar mengajar di lingkungan SMKN 11 Kabupaten Tangerang.', 'category' => 'Kurikulum', 'sort_order' => 1],
            ['title' => 'SOP Pelayanan Administrasi Peserta Didik', 'slug' => 'sop-pelayanan-administrasi-peserta-didik', 'description' => 'Prosedur layanan administrasi dan pengajuan dokumen peserta didik.', 'category' => 'Kesiswaan', 'sort_order' => 2],
            ['title' => 'SOP Penggunaan Laboratorium Komputer', 'slug' => 'sop-penggunaan-laboratorium-komputer', 'description' => 'Ketentuan penggunaan, keamanan, dan pemeliharaan laboratorium komputer sekolah.', 'category' => 'Sarana Prasarana', 'sort_order' => 3],
        ];

        foreach ($documents as $document) {
            Sop::updateOrCreate(['slug' => $document['slug']], [
                ...$document,
                'drive_url' => null,
                'drive_file_id' => null,
                'is_published' => false,
            ]);
        }
    }
}
