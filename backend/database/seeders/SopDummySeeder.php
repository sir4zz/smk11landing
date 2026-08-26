<?php

namespace Database\Seeders;

use App\Models\Sop;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

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
            $path = 'sop/dummy/'.$document['slug'].'.pdf';
            Storage::disk('local')->put($path, $this->samplePdf($document['title']));

            Sop::updateOrCreate(['slug' => $document['slug']], [
                ...$document,
                'file_path' => $path,
                'is_published' => true,
            ]);
        }
    }

    private function samplePdf(string $title): string
    {
        $safeTitle = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $title);
        $stream = "BT\n/F1 18 Tf\n72 720 Td\n({$safeTitle}) Tj\n0 -32 Td\n/F1 11 Tf\n(Dokumen contoh untuk fitur SOP SMKN 11 Kabupaten Tangerang.) Tj\nET\n";
        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
            '<< /Length '.strlen($stream)." >>\nstream\n{$stream}endstream",
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [0];
        foreach ($objects as $index => $object) {
            $offsets[] = strlen($pdf);
            $pdf .= ($index + 1)." 0 obj\n{$object}\nendobj\n";
        }
        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 ".(count($objects) + 1)."\n0000000000 65535 f \n";
        for ($index = 1; $index <= count($objects); $index++) {
            $pdf .= sprintf('%010d 00000 n ', $offsets[$index])."\n";
        }
        $pdf .= "trailer\n<< /Size ".(count($objects) + 1)." /Root 1 0 R >>\nstartxref\n{$xrefOffset}\n%%EOF\n";

        return $pdf;
    }
}
