<?php
use App\Models\News;
use App\Models\Program;
use App\Models\Facility;

News::firstOrCreate(["slug" => "ppdb-2026-dibuka"], [
    "title" => "PPDB Tahun Ajaran 2026/2027 Resmi Dibuka",
    "date" => "2026-05-10",
    "excerpt" => "Penerimaan Peserta Didik Baru (PPDB) SMKN 11 akan segera dimulai. Siapkan dokumen Anda.",
    "content" => "Penerimaan Peserta Didik Baru (PPDB) SMKN 11 akan segera dimulai. Silakan pantau terus website ini untuk informasi lebih lanjut mengenai jadwal, persyaratan, dan alur pendaftaran.",
    "category" => "Pengumuman",
    "author" => "Panitia PPDB",
    "source_type" => "manual",
    "source_label" => "Berita Mandiri",
    "thumbnail" => "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=600&auto=format&fit=crop"
]);

Program::firstOrCreate(["slug" => "rpl"], [
    "name" => "Rekayasa Perangkat Lunak",
    "short_name" => "RPL",
    "description" => "Program keahlian yang mempelajari pengembangan perangkat lunak, web, dan aplikasi mobile.",
    "short_description" => "Pengembangan Web & Aplikasi",
    "icon" => "Monitor"
]);

Program::firstOrCreate(["slug" => "dkv"], [
    "name" => "Desain Komunikasi Visual",
    "short_name" => "DKV",
    "description" => "Program keahlian yang fokus pada desain grafis, animasi, dan multimedia.",
    "short_description" => "Desain Grafis & Multimedia",
    "icon" => "Palette"
]);

Facility::firstOrCreate(["name" => "Laboratorium Komputer"], [
    "description" => "Lab komputer dengan spesifikasi tinggi untuk menunjang praktik siswa.",
    "category" => "Akademik"
]);

echo "Dummy data seeded successfully.\n";

