<?php

namespace App\Services;

use App\Models\SdmAssignment;
use App\Models\SdmCertification;
use App\Models\SdmEducation;
use App\Models\SdmGuru;
use App\Models\SdmKgb;
use App\Models\SdmSkPengangkatan;
use App\Models\SdmTendik;
use Illuminate\Support\Facades\DB;

/**
 * Validation + upsert engine for SDM import (Guru & Tenaga Kependidikan).
 *
 * Identifier priority per person: NIP -> NIPPPK -> NUPTK -> Nama (fallback).
 * The import is atomic (single DB transaction): valid rows are created or
 * updated, duplicate/problematic rows are reported and skipped.
 */
class SdmImportService
{
    private const IDENTIFIER_KEYS = ['nip', 'nipppk', 'nuptk'];

    private const PROBLEM_EMPTY_NAME = 'Nama wajib diisi.';
    private const PROBLEM_NO_DATA = 'Tidak ada data yang bisa diimport.';

    public function analyzePersons(array $persons, string $type): array
    {
        $seenIdentifiers = [];
        $seenNames = [];

        $items = [];
        $valid = 0;
        $duplicates = 0;
        $problematic = 0;
        $newCount = 0;
        $updateCount = 0;

        foreach ($persons as $index => $person) {
            $person = is_array($person) ? $person : [];
            $name = $this->clean((string) ($person['name'] ?? ''));
            $identifierKey = $this->identifierKey($person);
            $identifier = $this->cleanId($person[$identifierKey] ?? '');

            $issues = [];
            if ($name === '') {
                $issues[] = self::PROBLEM_EMPTY_NAME;
            } else {
                $nameKey = $this->nameKey($name);
                if (! $identifierKey && isset($seenNames[$nameKey])) {
                    $issues[] = 'Duplikat dalam file (nama yang sama tanpa NIP/NIPPPK/NUPTK).';
                }
                $seenNames[$nameKey] = true;
            }

            if ($identifierKey) {
                if (isset($seenIdentifiers[$identifierKey][$identifier])) {
                    $issues[] = 'Duplikat dalam file ('.$identifierKey.' sama).';
                }
                $seenIdentifiers[$identifierKey][$identifier] = true;
            }

            if ($name === '' && $this->isEmptyPerson($person)) {
                $issues = [self::PROBLEM_NO_DATA];
            }

            $status = 'new';
            $existing = null;

            if ($issues) {
                $status = $this->statusForIssues($issues);
            } else {
                $existing = $this->findExisting($type, $identifierKey, $identifier, $name);
                $status = $existing ? 'update' : 'new';
            }

            if (in_array($status, ['new', 'update'], true)) {
                $valid++;
            }
            if ($status === 'new') {
                $newCount++;
            }
            if ($status === 'update') {
                $updateCount++;
            }
            if ($status === 'duplicate') {
                $duplicates++;
            }
            if ($status === 'problematic') {
                $problematic++;
            }

            $items[] = [
                'index' => $index + 1,
                'name' => $name !== '' ? $name : (string) ($person['name'] ?? ''),
                'identifier' => $identifierKey ? $identifierKey.': '.$identifier : 'Nama (fallback)',
                'status' => $status,
                'issues' => $issues,
                'gender' => $this->clean((string) ($person['gender'] ?? '')),
                'jabatan' => $this->clean((string) ($person['jabatan'] ?? '')),
            ];
        }

        return [
            'summary' => [
                'total' => count($items),
                'valid' => $valid,
                'new' => $newCount,
                'update' => $updateCount,
                'duplicates' => $duplicates,
                'problematic' => $problematic,
            ],
            'items' => $items,
        ];
    }

    /**
     * Atomic upsert. Returns the summary + errors. Nothing is committed when
     * an unexpected database error occurs.
     */
    public function importPersons(array $persons, string $type): array
    {
        $model = $this->mainModel($type);

        return DB::transaction(function () use ($persons, $type, $model) {
            $seenIdentifiers = [];
            $seenNames = [];
            $imported = 0;
            $updated = 0;
            $skipped = 0;
            $errors = [];

            foreach ($persons as $index => $person) {
                $person = is_array($person) ? $person : [];
                $name = $this->clean((string) ($person['name'] ?? ''));
                $identifierKey = $this->identifierKey($person);
                $identifier = $this->cleanId($person[$identifierKey] ?? '');

                try {
                    if ($name === '') {
                        throw new \RuntimeException(self::PROBLEM_EMPTY_NAME);
                    }

                    $nameKey = $this->nameKey($name);
                    if (! $identifierKey && isset($seenNames[$nameKey])) {
                        throw new \RuntimeException('Duplikat dalam file (nama yang sama tanpa NIP/NIPPPK/NUPTK).');
                    }
                    $seenNames[$nameKey] = true;

                    if ($identifierKey) {
                        if (isset($seenIdentifiers[$identifierKey][$identifier])) {
                            throw new \RuntimeException('Duplikat dalam file ('.$identifierKey.' sama).');
                        }
                        $seenIdentifiers[$identifierKey][$identifier] = true;
                    }

                    $existing = $this->findExisting($type, $identifierKey, $identifier, $name);

                    $main = $this->normalizeMain($person, $type);
                    $main['name'] = $name;

                    if ($type === 'guru' && $identifierKey) {
                        $main['user_id'] = $this->linkGuruAccount($identifierKey, $identifier);
                    }

                    if ($existing) {
                        $existing->update($main);
                        $record = $existing;
                        $updated++;
                    } else {
                        $record = $model::create($main);
                        $imported++;
                    }

                    $this->replaceChildren($type, $record->id, $person);
                } catch (\Throwable $e) {
                    $skipped++;
                    $errors[] = [
                        'row' => $index + 1,
                        'name' => $name !== '' ? $name : (string) ($person['name'] ?? ''),
                        'message' => $e->getMessage(),
                    ];
                }
            }

            return [
                'summary' => [
                    'total' => count($persons),
                    'imported' => $imported,
                    'updated' => $updated,
                    'skipped' => $skipped,
                ],
                'errors' => $errors,
            ];
        });
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private function mainModel(string $type): string
    {
        return $type === 'guru' ? SdmGuru::class : SdmTendik::class;
    }

    private function identifierKey(array $person): ?string
    {
        foreach (self::IDENTIFIER_KEYS as $key) {
            if ($this->cleanId($person[$key] ?? '') !== '') {
                return $key;
            }
        }

        return null;
    }

    private function findExisting(string $type, ?string $key, string $identifier, string $name): ?object
    {
        $model = $this->mainModel($type);

        if ($key) {
            $record = $model::query()->where($key, $identifier)->first();
            if ($record) {
                return $record;
            }
        }

        if ($name !== '') {
            return $model::query()->where('name', $name)->first();
        }

        return null;
    }

    private function statusForIssues(array $issues): string
    {
        foreach ($issues as $issue) {
            if (str_starts_with($issue, 'Duplikat dalam file')) {
                return 'duplicate';
            }
        }

        return 'problematic';
    }
    private function normalizeMain(array $person, string $type): array
    {
        return [
            'nip' => $this->nullableId($person['nip'] ?? null),
            'nipppk' => $this->nullableId($person['nipppk'] ?? null),
            'nuptk' => $this->nullableId($person['nuptk'] ?? null),
            'gender' => $this->clean((string) ($person['gender'] ?? '')),
            'religion' => $this->clean((string) ($person['religion'] ?? '')),
            'birth_place' => $this->clean((string) ($person['birth_place'] ?? '')),
            'birth_date' => $this->nullableDate($person['birth_date'] ?? null),
            'status_kepegawaian' => $this->clean((string) ($person['status_kepegawaian'] ?? '')),
            'pangkat_golongan' => $this->clean((string) ($person['pangkat_golongan'] ?? '')),
            'jabatan' => $this->clean((string) ($person['jabatan'] ?? '')),
            'tmt_golongan' => $this->nullableDate($person['tmt_golongan'] ?? null),
            'tmt_cpns' => $this->nullableDate($person['tmt_cpns'] ?? null),
            'tmt_pns_pppk' => $this->nullableDate($person['tmt_pns_pppk'] ?? null),
            'tmt_sk_sekolah' => $this->nullableDate($person['tmt_sk_sekolah'] ?? null),
            'nik' => $this->nullableId($person['nik'] ?? null),
            'address' => $this->clean((string) ($person['address'] ?? '')),
            'phone' => $this->clean((string) ($person['phone'] ?? '')),
            'npwp' => $this->clean((string) ($person['npwp'] ?? '')),
            'akta_lahir' => $this->clean((string) ($person['akta_lahir'] ?? '')),
            'bpjs' => $this->clean((string) ($person['bpjs'] ?? '')),
            'email' => $this->clean((string) ($person['email'] ?? '')),
            'bio' => $this->clean((string) ($person['bio'] ?? '')),
            'is_active' => true,
        ];
    }

    public function replaceChildren(string $type, string $staffId, array $person): void
    {
        $staffType = $type === 'guru' ? SdmGuru::STAFF_TYPE : SdmTendik::STAFF_TYPE;

        // Pendidikan
        SdmEducation::query()->forStaff($staffType, $staffId)->delete();
        foreach (array_values((array) ($person['educations'] ?? [])) as $i => $row) {
            if (! is_array($row)) {
                continue;
            }
            SdmEducation::create([
                'staff_type' => $staffType,
                'staff_id' => $staffId,
                'sort_order' => $i,
                'jenjang' => $this->clean((string) ($row['jenjang'] ?? '')),
                'jurusan' => $this->clean((string) ($row['jurusan'] ?? '')),
                'perguruan_tinggi' => $this->clean((string) ($row['perguruan_tinggi'] ?? '')),
                'tahun_lulus' => $this->nullableInt($row['tahun_lulus'] ?? null),
                'tempat' => $this->clean((string) ($row['tempat'] ?? '')),
                'nomor_ijazah' => $this->clean((string) ($row['nomor_ijazah'] ?? '')),
                'tanggal_ijazah' => $this->nullableDate($row['tanggal_ijazah'] ?? null),
            ]);
        }

        // Tugas
        SdmAssignment::query()->forStaff($staffType, $staffId)->delete();
        foreach (array_values((array) ($person['assignments'] ?? [])) as $i => $row) {
            if (! is_array($row)) {
                continue;
            }
            $jenis = $this->clean((string) ($row['jenis'] ?? 'tugas_tambahan'));
            if (! in_array($jenis, [SdmAssignment::JENIS_TUGAS_TAMBAHAN, SdmAssignment::JENIS_TUGAS_MENGAJAR], true)) {
                $jenis = SdmAssignment::JENIS_TUGAS_TAMBAHAN;
            }
            SdmAssignment::create([
                'staff_type' => $staffType,
                'staff_id' => $staffId,
                'sort_order' => $i,
                'jenis' => $jenis,
                'uraian' => $this->clean((string) ($row['uraian'] ?? '')),
                'jumlah_jam' => $this->clean((string) ($row['jumlah_jam'] ?? '')),
            ]);
        }

        // Sertifikasi
        SdmCertification::query()->forStaff($staffType, $staffId)->delete();
        foreach (array_values((array) ($person['certifications'] ?? [])) as $i => $row) {
            if (! is_array($row)) {
                continue;
            }
            SdmCertification::create([
                'staff_type' => $staffType,
                'staff_id' => $staffId,
                'sort_order' => $i,
                'status' => $this->clean((string) ($row['status'] ?? '')),
                'no_sertifikat' => $this->clean((string) ($row['no_sertifikat'] ?? '')),
                'no_peserta' => $this->clean((string) ($row['no_peserta'] ?? '')),
                'no_nrg' => $this->clean((string) ($row['no_nrg'] ?? '')),
                'bidang_studi' => $this->clean((string) ($row['bidang_studi'] ?? '')),
                'penyelenggara' => $this->clean((string) ($row['penyelenggara'] ?? '')),
                'tahun_lulus' => $this->nullableInt($row['tahun_lulus'] ?? null),
            ]);
        }

        // KGB (single row)
        SdmKgb::query()->forStaff($staffType, $staffId)->delete();
        $kgb = $person['kgb'] ?? null;
        if (is_array($kgb)) {
            SdmKgb::create([
                'staff_type' => $staffType,
                'staff_id' => $staffId,
                'sort_order' => 0,
                'no_sk' => $this->clean((string) ($kgb['no_sk'] ?? '')),
                'tanggal_sk' => $this->nullableDate($kgb['tanggal_sk'] ?? null),
                'gaji_pokok' => $this->clean((string) ($kgb['gaji_pokok'] ?? '')),
                'mkg' => $this->clean((string) ($kgb['mkg'] ?? '')),
                'tmt_kgb_akhir' => $this->nullableDate($kgb['tmt_kgb_akhir'] ?? null),
                'tmt_kgb_berikutnya' => $this->nullableDate($kgb['tmt_kgb_berikutnya'] ?? null),
            ]);
        }

        // SK Pengangkatan
        SdmSkPengangkatan::query()->forStaff($staffType, $staffId)->delete();
        foreach (array_values((array) ($person['sk_pengangkatans'] ?? [])) as $i => $row) {
            if (! is_array($row)) {
                continue;
            }
            SdmSkPengangkatan::create([
                'staff_type' => $staffType,
                'staff_id' => $staffId,
                'sort_order' => $i,
                'kategori' => $this->clean((string) ($row['kategori'] ?? '')),
                'nomor_sk' => $this->clean((string) ($row['nomor_sk'] ?? '')),
                'tanggal_sk' => $this->nullableDate($row['tanggal_sk'] ?? null),
                'pejabat' => $this->clean((string) ($row['pejabat'] ?? '')),
            ]);
        }
    }

    /**
     * Link to the existing Guru account system when a guru login account with
     * the same NIP/NUPTK already exists. The legacy `gurus` table only stores
     * `nip`, `nuptk` and `teacher_id` — NIPPPK is not available there.
     */
    private function linkGuruAccount(string $key, string $identifier): ?string
    {
        if (! in_array($key, ['nip', 'nuptk'], true)) {
            return null;
        }

        $account = \App\Models\Guru::query()->where($key, $identifier)->first();

        return $account?->id;
    }

    private function isEmptyPerson(array $person): bool
    {
        unset($person['name']);
        $all = array_filter((array) $person, fn ($v) => $v !== null && $v !== '' && $v !== []);

        return count($all) === 0;
    }

    private function nameKey(string $name): string
    {
        return strtolower(preg_replace('/\s+/', ' ', trim($name)) ?? '');
    }

    private function clean(string $value): string
    {
        $value = trim($value);

        return $value === '-' ? '' : $value;
    }

    private function cleanId(mixed $value): string
    {
        $value = trim((string) $value);
        $value = str_replace([' ', '.', "\t"], '', $value);

        return $value === '-' ? '' : $value;
    }

    private function nullableId(mixed $value): ?string
    {
        $value = $this->cleanId($value);

        return $value !== '' ? $value : null;
    }

    private function nullableDate(mixed $value): ?string
    {
        if (empty($value)) {
            return null;
        }
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }
        $text = trim((string) $value);
        if ($text === '' || $text === '-') {
            return null;
        }
        // dd-MM-yyyy / dd/MM/yyyy
        if (preg_match('#^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$#', $text, $m)) {
            return sprintf('%04d-%02d-%02d', (int) $m[3], (int) $m[2], (int) $m[1]);
        }
        // yyyy-MM-dd or ISO-ish
        if (preg_match('#^(\d{4})-(\d{1,2})-(\d{1,2})#', $text, $m)) {
            return sprintf('%04d-%02d-%02d', (int) $m[1], (int) $m[2], (int) $m[3]);
        }
        if (preg_match('#^(\d{1,2})-(\d{1,2})-\d{4}#', $text, $m)) {
            return $text;
        }

        $parsed = strtotime($text);
        if ($parsed === false) {
            return null;
        }

        return date('Y-m-d', $parsed);
    }

    private function nullableInt(mixed $value): ?int
    {
        if ($value === null || $value === '' || $value === '-') {
            return null;
        }
        $text = preg_replace('/\D/', '', (string) $value);
        if ($text === '') {
            return null;
        }

        return (int) $text;
    }
}