<?php

namespace App\Services;

use App\Models\StudentDataChangeRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    public function sendText(string $phone, string $message): bool
    {
        if (!config('services.whatsapp.enabled')) {
            return false;
        }

        if (trim($phone) === '' || trim($message) === '') {
            return false;
        }

        try {
            $response = Http::connectTimeout(config('services.whatsapp.connect_timeout'))
                ->timeout(config('services.whatsapp.timeout'))
                ->when(config('services.whatsapp.token') !== '', function ($http) {
                    $http->withHeaders([
                        'x-wa-token' => config('services.whatsapp.token'),
                    ]);
                })
                ->post(rtrim(config('services.whatsapp.url'), '/') . '/send', [
                    'to' => $phone,
                    'message' => $message,
                ]);

            if (!$response->successful()) {
                Log::warning('WhatsApp service gagal mengirim pesan.', [
                    'to' => $phone,
                    'status' => $response->status(),
                    'body' => $response->json(),
                ]);
                return false;
            }

            return true;
        } catch (\Throwable $e) {
            // Pengiriman WA tidak boleh menggagalkan proses utama.
            Log::warning('WhatsApp service tidak dapat dihubungi: ' . $e->getMessage(), [
                'to' => $phone,
            ]);

            return false;
        }
    }

    public function sendGraduationVerification($record): bool
    {
        if (empty($record->phone)) {
            return false;
        }

        $statusLabels = [
            'terverifikasi' => 'Terverifikasi',
            'ditolak' => 'Ditolak',
            'menunggu' => 'Menunggu Verifikasi',
        ];

        $status = $record->verification_status;
        $label = $statusLabels[$status] ?? ucfirst($status);

        if ($status === 'terverifikasi') {
            $greeting = "Selamat! Data kelulusan Anda telah *{$label}*.";
        } elseif ($status === 'ditolak') {
            $greeting = "Mohon maaf, data kelulusan Anda *{$label}* oleh admin.";
        } else {
            $greeting = "Status verifikasi data kelulusan Anda saat ini: *{$label}*.";
        }

        $lines = [
            "*SMKN 11 - Notifikasi Kelulusan Siswa*",
            "",
            "Halo {$record->name},",
            $greeting,
            "",
            "Detail data:",
            "- NISN: {$record->nisn}",
            "- Jurusan: {$record->major}",
            "- Tahun Lulus: {$record->graduation_year}",
        ];

        $note = trim((string) ($record->verification_note ?? ''));
        if ($note !== '') {
            $lines[] = "";
            $lines[] = "Catatan admin: {$note}";
        }

        $lines[] = "";
        $lines[] = "Terima kasih. Pesan ini dikirim otomatis, mohon tidak membalas.";

        return $this->sendText($record->phone, implode("\n", $lines));
    }

    public function sendStudentDataChangeVerification(StudentDataChangeRequest $changeRequest): bool
    {
        // Prioritas: nomor baru yang diajukan siswa, lalu nomor yang sudah ada di data siswa.
        $proposed = $changeRequest->proposed_data ?? [];
        $phone = $proposed['phone'] ?? ($changeRequest->student->phone ?? '');

        if (trim((string) $phone) === '') {
            return false;
        }

        $status = $changeRequest->status;

        if ($status === 'disetujui') {
            $greeting = 'Pengajuan perubahan data Anda telah *Disetujui* dan data Anda sudah diperbarui.';
        } elseif ($status === 'ditolak') {
            $greeting = 'Mohon maaf, pengajuan perubahan data Anda *Ditolak* oleh operator.';
        } else {
            return false;
        }

        $lines = [
            "*SMKN 11 - Notifikasi Verifikasi Perubahan Data Siswa*",
            "",
            "Halo {$changeRequest->student->name},",
            $greeting,
            "",
            "Kolom yang diajukan:",
        ];

        foreach (array_keys($proposed) as $field) {
            if ($field === 'pin' || $field === 'current_pin') {
                continue;
            }
            $lines[] = "- {$this->fieldLabel($field)}";
        }

        $reason = trim((string) ($changeRequest->rejection_reason ?? ''));
        if ($status === 'ditolak' && $reason !== '') {
            $lines[] = "";
            $lines[] = "Alasan penolakan: {$reason}";
        }

        $lines[] = "";
        $lines[] = "Terima kasih. Pesan ini dikirim otomatis, mohon tidak membalas.";

        return $this->sendText($phone, implode("\n", $lines));
    }

    private function fieldLabel(string $field): string
    {
        $labels = [
            'name' => 'Nama Lengkap',
            'nickname' => 'Nama Panggilan',
            'class' => 'Kelas',
            'major' => 'Jurusan',
            'gender' => 'Jenis Kelamin',
            'religion' => 'Agama',
            'kewarganegaraan' => 'Kewarganegaraan',
            'jml_saudara_kandung' => 'Jumlah Saudara Kandung',
            'jml_saudara_tiri' => 'Jumlah Saudara Tiri',
            'anak_yatim_piatu' => 'Status Yatim/Piatu',
            'bahasa_sehari_hari' => 'Bahasa Sehari-hari',
            'phone' => 'Nomor HP/WA',
            'tinggal_dengan' => 'Tinggal Dengan',
            'jarak_sekolah' => 'Jarak ke Sekolah',
            'golongan_darah' => 'Golongan Darah',
            'penyakit' => 'Penyakit',
            'kelainan_jasmani' => 'Kelainan Jasmani',
            'tinggi_cm' => 'Tinggi Badan (cm)',
            'berat_kg' => 'Berat Badan (kg)',
            'gemar_kesenian' => 'Gemar Kesenian',
            'gemar_olahraga' => 'Gemar Olahraga',
            'gemar_kemasyarakatan' => 'Gemar Kemasyarakatan',
            'gemar_lain' => 'Gemar Lainnya',
            'siswa_status' => 'Status Siswa',
            'siswa_tanggal' => 'Tanggal Status Siswa',
            'doc_kk' => 'Dokumen Kartu Keluarga',
            'doc_akta' => 'Dokumen Akta Kelahiran',
            'doc_ijazah' => 'Dokumen Ijazah',
            'doc_lainnya' => 'Dokumen Lainnya',
            'foto' => 'Foto Profil',
        ];

        if (isset($labels[$field])) {
            return $labels[$field];
        }

        foreach (['ayah' => 'Ayah', 'ibu' => 'Ibu', 'wali' => 'Wali'] as $prefix => $label) {
            if (str_starts_with($field, "{$prefix}_")) {
                $suffixLabels = [
                    'tempat' => 'Tempat Lahir',
                    'tanggal_lahir' => 'Tanggal Lahir',
                    'agama' => 'Agama',
                    'kewarganegaraan' => 'Kewarganegaraan',
                    'pendidikan' => 'Pendidikan',
                    'pekerjaan' => 'Pekerjaan',
                    'penghasilan' => 'Penghasilan',
                    'alamat' => 'Alamat',
                    'no_telp' => 'No. Telepon',
                    'status_hidup' => 'Status Hidup',
                ];
                $suffix = substr($field, strlen($prefix) + 1);
                if (isset($suffixLabels[$suffix])) {
                    return "{$label} - {$suffixLabels[$suffix]}";
                }
            }
        }

        return ucwords(str_replace('_', ' ', $field));
    }
}
