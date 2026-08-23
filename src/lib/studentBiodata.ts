// Definisi kolom BIODATA PESERTA DIDIK BARU (76 kolom, 10 seksi).
// Dipakai bersama oleh StudentsManagement (form) dan StudentImportModal (import).

export interface BiodataFieldDef {
  key: string;
  label: string;
  section: string;
  subsection?: string;
  type?: 'text' | 'number' | 'decimal' | 'date' | 'select' | 'textarea';
  options?: string[];
  placeholder?: string;
  full?: boolean;
}

export interface BiodataSectionDef {
  id: string;
  title: string;
}

export const BIODATA_SECTIONS: BiodataSectionDef[] = [
  { id: 'identity', title: 'A. Keterangan Peserta Didik' },
  { id: 'residence', title: 'B. Keterangan Tempat Tinggal' },
  { id: 'health', title: 'C. Keterangan Kesehatan' },
  { id: 'education', title: 'D. Keterangan Pendidikan' },
  { id: 'father', title: 'E. Keterangan Ayah Kandung' },
  { id: 'mother', title: 'F. Keterangan Ibu Kandung' },
  { id: 'guardian', title: 'G. Keterangan Wali' },
  { id: 'hobby', title: 'H. Kegemaran Siswa' },
  { id: 'student', title: 'I. Keterangan Siswa' },
];

const GENDER_OPTIONS = ['', 'L', 'P'];
const RELIGION_OPTIONS = ['', 'Islam', 'Kristen Protestan', 'Kristen Katolik', 'Hindu', 'Buddha', 'Khonghucu'];
const BLOOD_OPTIONS = ['', 'A', 'B', 'AB', 'O'];
const YATIM_OPTIONS = ['', 'Yatim', 'Piatu', 'Yatim-Piatu'];
const ALIVE_OPTIONS = ['', 'Masih Hidup', 'Meninggal'];

export const VALID_CLASSES = ['X', 'XI', 'XII'];
export const CLASS_OPTIONS = ['', ...VALID_CLASSES];

export function normalizeClass(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

export function isValidClass(value: unknown): boolean {
  return VALID_CLASSES.includes(normalizeClass(value));
}

function parentFields(prefix: string, section: string): BiodataFieldDef[] {
  return [
    { key: `${prefix}_nama`, label: 'Nama', section },
    { key: `${prefix}_tempat`, label: 'Tempat Lahir', section },
    { key: `${prefix}_tanggal_lahir`, label: 'Tanggal Lahir', section, type: 'date' },
    { key: `${prefix}_agama`, label: 'Agama', section, type: 'select', options: RELIGION_OPTIONS },
    { key: `${prefix}_kewarganegaraan`, label: 'Kewarganegaraan', section },
    { key: `${prefix}_pendidikan`, label: 'Pendidikan', section },
    { key: `${prefix}_pekerjaan`, label: 'Pekerjaan', section },
    { key: `${prefix}_penghasilan`, label: 'Penghasilan per Bulan', section, type: 'number' },
    { key: `${prefix}_alamat`, label: 'Alamat Rumah', section, type: 'textarea', full: true },
    { key: `${prefix}_no_telp`, label: 'No. HP/Telp', section, type: 'number' },
    { key: `${prefix}_status_hidup`, label: 'Masih Hidup/Meninggal', section, type: 'select', options: ALIVE_OPTIONS },
  ];
}

export const BIODATA_FIELDS: BiodataFieldDef[] = [
  // A. Keterangan Peserta Didik
  { key: 'nisn', label: 'NISN', section: 'identity', placeholder: 'cth. 0061234567', type: 'number' },
  { key: 'nis', label: 'NIS', section: 'identity', placeholder: 'cth. 12345', type: 'number' },
  { key: 'name', label: 'Nama Lengkap', section: 'identity', full: true },
  { key: 'nickname', label: 'Nama Panggilan', section: 'identity' },
  { key: 'class', label: 'Kelas', section: 'identity', type: 'select', options: CLASS_OPTIONS },
  { key: 'major', label: 'Jurusan', section: 'identity', placeholder: 'cth. Teknik Komputer dan Jaringan' },
  { key: 'gender', label: 'Jenis Kelamin', section: 'identity', type: 'select', options: GENDER_OPTIONS },
  { key: 'place_of_birth', label: 'Tempat Lahir', section: 'identity', placeholder: 'cth. Bandung' },
  { key: 'date_of_birth', label: 'Tanggal Lahir', section: 'identity', type: 'date' },
  { key: 'religion', label: 'Agama', section: 'identity', type: 'select', options: RELIGION_OPTIONS },
  { key: 'kewarganegaraan', label: 'Kewarganegaraan', section: 'identity', placeholder: 'cth. Indonesia' },
  { key: 'anak_ke', label: 'Anak Ke', section: 'identity', type: 'number' },
  { key: 'jml_saudara_kandung', label: 'Jumlah Saudara Kandung', section: 'identity', type: 'number' },
  { key: 'jml_saudara_tiri', label: 'Jumlah Saudara Tiri', section: 'identity', type: 'number' },
  { key: 'anak_yatim_piatu', label: 'Anak Yatim / Piatu', section: 'identity', type: 'select', options: YATIM_OPTIONS },
  { key: 'bahasa_sehari_hari', label: 'Bahasa Sehari-hari', section: 'identity', placeholder: 'cth. Indonesia' },

  // B. Keterangan Tempat Tinggal
  { key: 'address', label: 'Alamat Tempat Tinggal', section: 'residence', type: 'textarea', full: true },
  { key: 'phone', label: 'No. Telp / HP', section: 'residence', type: 'number' },
  { key: 'tinggal_dengan', label: 'Tinggal Dengan (Orang Tua/Saudara/Asrama/Kost)', section: 'residence' },
  { key: 'jarak_sekolah', label: 'Jarak Tempat Tinggal ke Sekolah (Meter)', section: 'residence', type: 'decimal' },

  // C. Keterangan Kesehatan
  { key: 'golongan_darah', label: 'Golongan Darah', section: 'health', type: 'select', options: BLOOD_OPTIONS },
  { key: 'penyakit', label: 'Penyakit yang Pernah Diderita', section: 'health', type: 'textarea' },
  { key: 'kelainan_jasmani', label: 'Kelainan Jasmani', section: 'health', type: 'textarea' },
  { key: 'tinggi_cm', label: 'Tinggi (cm)', section: 'health', type: 'number' },
  { key: 'berat_kg', label: 'Berat (kg)', section: 'health', type: 'number' },

  // D. Keterangan Pendidikan
  // ── Pendidikan Sebelumnya ──
  { key: 'lulusan_dari', label: 'Lulusan Dari', section: 'education', subsection: 'Pendidikan Sebelumnya' },
  { key: 'tanggal_sttb', label: 'Tanggal STTB/Ijazah', section: 'education', subsection: 'Pendidikan Sebelumnya', type: 'date' },
  { key: 'nomor_sttb', label: 'Nomor STTB/Ijazah', section: 'education', subsection: 'Pendidikan Sebelumnya', type: 'number' },
  { key: 'lama_belajar', label: 'Lama Belajar (Tahun)', section: 'education', subsection: 'Pendidikan Sebelumnya', type: 'number' },
  // ── Pindahan ──
  { key: 'pindahan_dari', label: 'Dari Sekolah', section: 'education', subsection: 'Pindahan' },
  { key: 'alasan_pindah', label: 'Alasan', section: 'education', subsection: 'Pindahan' },
  // ── Diterima di Sekolah Ini ──
  { key: 'diangkat', label: 'Diangkat', section: 'education', subsection: 'Diterima di Sekolah Ini' },
  { key: 'kompetensi_keahlian', label: 'Kompetensi/Keahlian', section: 'education', subsection: 'Diterima di Sekolah Ini' },
  { key: 'tanggal_diterima', label: 'Tanggal Diterima', section: 'education', subsection: 'Diterima di Sekolah Ini', type: 'date' },

  // E. Ayah
  ...parentFields('ayah', 'father'),
  // F. Ibu
  ...parentFields('ibu', 'mother'),
  // G. Wali
  ...parentFields('wali', 'guardian'),

  // H. Kegemaran Siswa
  { key: 'gemar_kesenian', label: 'Kesenian', section: 'hobby' },
  { key: 'gemar_olahraga', label: 'Olahraga', section: 'hobby' },
  { key: 'gemar_kemasyarakatan', label: 'Kemasyarakatan', section: 'hobby' },
  { key: 'gemar_lain', label: 'Lain-lain', section: 'hobby' },

  // I. Keterangan Siswa
  { key: 'siswa_status', label: 'Status', section: 'student' },
  { key: 'siswa_tanggal', label: 'Tanggal', section: 'student', type: 'date' },
];

export interface FieldGroup {
  subsection: string;
  fields: BiodataFieldDef[];
}

export function groupFieldsBySubsection(fields: BiodataFieldDef[]): FieldGroup[] {
  const groups: FieldGroup[] = [];
  let cur: string | null = null;
  for (const f of fields) {
    const sub = f.subsection ?? '';
    if (sub !== cur) {
      groups.push({ subsection: sub, fields: [] });
      cur = sub;
    }
    groups[groups.length - 1].fields.push(f);
  }
  return groups;
}

// Field yang wajib dalam bentuk apa pun.
export const REQUIRED_KEYS = ['nisn', 'name'];

// Struktur template BIODATA: satu workbook, satu sheet per seksi.
// Tiap sheet: baris index 0 judul, index 1 nama kolom, index 2 contoh,
// data dimulai dari index 3 (TEMPLATE_HEADER_ROWS).
// Kolom NISN (kolom pertama di sheet 02-08, kolom 3 di sheet 01) dipakai
// sebagai kunci penggabungan antar-sheet menjadi satu record per siswa.
export const TEMPLATE_SHEETS: { name: string; columns: Record<number, string> }[] = [
  {
    name: '01 - Peserta Didik',
    columns: {
      1: 'nis',
      2: 'class',
      3: 'nisn',
      4: 'major',
      5: 'name',
      6: 'nickname',
      7: 'gender',
      8: 'place_of_birth',
      9: 'date_of_birth',
      10: 'religion',
      11: 'kewarganegaraan',
      12: 'anak_ke',
      13: 'jml_saudara_kandung',
      14: 'jml_saudara_tiri',
      15: 'anak_yatim_piatu',
      16: 'bahasa_sehari_hari',
    },
  },
  {
    name: '02 - Tempat Tinggal',
    columns: {
      0: 'nisn',
      1: 'address',
      2: 'phone',
      3: 'tinggal_dengan',
      4: 'jarak_sekolah',
    },
  },
  {
    name: '03 - Kesehatan',
    columns: {
      0: 'nisn',
      1: 'golongan_darah',
      2: 'penyakit',
      3: 'kelainan_jasmani',
      4: 'tinggi_cm',
      5: 'berat_kg',
    },
  },
  {
    name: '04 - Pendidikan',
    columns: {
      0: 'nisn',
      1: 'lulusan_dari',
      2: 'tanggal_sttb',
      3: 'nomor_sttb',
      4: 'lama_belajar',
      5: 'pindahan_dari',
      6: 'alasan_pindah',
      7: 'diangkat',
      8: 'kompetensi_keahlian',
      9: 'tanggal_diterima',
    },
  },
  {
    name: '05 - Ayah',
    columns: {
      0: 'nisn',
      1: 'ayah_nama',
      2: 'ayah_tempat',
      3: 'ayah_tanggal_lahir',
      4: 'ayah_agama',
      5: 'ayah_kewarganegaraan',
      6: 'ayah_pendidikan',
      7: 'ayah_pekerjaan',
      8: 'ayah_penghasilan',
      9: 'ayah_alamat',
      10: 'ayah_no_telp',
      11: 'ayah_status_hidup',
    },
  },
  {
    name: '06 - Ibu',
    columns: {
      0: 'nisn',
      1: 'ibu_nama',
      2: 'ibu_tempat',
      3: 'ibu_tanggal_lahir',
      4: 'ibu_agama',
      5: 'ibu_kewarganegaraan',
      6: 'ibu_pendidikan',
      7: 'ibu_pekerjaan',
      8: 'ibu_penghasilan',
      9: 'ibu_alamat',
      10: 'ibu_no_telp',
      11: 'ibu_status_hidup',
    },
  },
  {
    name: '07 - Wali',
    columns: {
      0: 'nisn',
      1: 'wali_nama',
      2: 'wali_tempat',
      3: 'wali_tanggal_lahir',
      4: 'wali_agama',
      5: 'wali_kewarganegaraan',
      6: 'wali_pendidikan',
      7: 'wali_pekerjaan',
      8: 'wali_penghasilan',
      9: 'wali_alamat',
      10: 'wali_no_telp',
      11: 'wali_status_hidup',
    },
  },
  {
    name: '08 - Data Tambahan',
    columns: {
      0: 'nisn',
      1: 'gemar_kesenian',
      2: 'gemar_olahraga',
      3: 'gemar_kemasyarakatan',
      4: 'gemar_lain',
      5: 'siswa_status',
      6: 'siswa_tanggal',
    },
  },
];

// Jumlah baris header per sheet (0-2), data mulai index 3.
export const TEMPLATE_HEADER_ROWS = 3;

// Key yang memerlukan normalisasi tanggal saat import.
export const DATE_KEYS: Set<string> = new Set([
  'date_of_birth',
  'tanggal_sttb',
  'tanggal_diterima',
  'ayah_tanggal_lahir',
  'ibu_tanggal_lahir',
  'wali_tanggal_lahir',
  'siswa_tanggal',
]);

export function emptyBiodata(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of BIODATA_FIELDS) out[field.key] = '';
  out.pin = '';
  return out;
}

export function normalizeGender(raw: unknown): string {
  const r = String(raw ?? '').trim().toLowerCase();
  if (r === 'l' || r === 'm' || r === 'pria' || r === 'laki' || r === 'laki-laki' || r === 'male' || r === 'laki laki') return 'L';
  if (r === 'p' || r === 'f' || r === 'wanita' || r === 'perempuan' || r === 'female') return 'P';
  return '';
}

export function toDateString(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const d = value;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  const raw = String(value).trim();
  if (!raw) return '';
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split('-');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  // Excel / Google Sheets serial number: days since 1899-12-30
  if (/^\d+(\.\d+)?$/.test(raw)) {
    const serial = Number(raw);
    if (serial >= 20000 && serial <= 80000) {
      const date = new Date(Date.UTC(1899, 11, 30 + serial));
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    }
  }
  return raw;
}

const RUPIAH_KEYS = new Set(['ayah_penghasilan', 'ibu_penghasilan', 'wali_penghasilan']);

export function isRupiahField(key: string): boolean {
  return RUPIAH_KEYS.has(key);
}

export function formatRupiah(raw: unknown): string {
  if (raw === null || raw === undefined || String(raw).trim() === '') return '-';
  const str = String(raw).trim();
  const num = Number(str.replace(/[^\d.-]/g, ''));
  if (Number.isNaN(num)) return str;
  return `Rp${num.toLocaleString('id-ID')}`;
}

// ==== DATA MASTER DAPODIK ====
// Nama kolom header DATA MASTER DAPODIK (huruf kecil) -> key baris hasil import.
const DAPODIK_COLUMN_MAP: Record<string, string> = {
  nisn: 'nisn',
  nis: 'nis',
  'nama siswa': 'name',
  'tempat lahir': 'place_of_birth',
  'tanggal lahir': 'date_of_birth',
  'jenis kelamin': 'gender',
  agama: 'religion',
  'anak ke': 'anak_ke',
  'jumlah saudara': 'jml_saudara_kandung',
  'no hp': 'phone',
  'jarak sekolah (km)': 'jarak_sekolah',
  'jarak sekolah (m)': 'jarak_sekolah',
  'jarak sekolah (meter)': 'jarak_sekolah',
  'jarak sekolah': 'jarak_sekolah',
  'pilihan jurusan 1': 'major',
  'status ayah': 'ayah_status_hidup',
  'nama ayah': 'ayah_nama',
  'tanggal lahir ayah': 'ayah_tanggal_lahir',
  'pendidikan ayah': 'ayah_pendidikan',
  'pekerjaan ayah': 'ayah_pekerjaan',
  'penghasilan ayah': 'ayah_penghasilan',
  'no hp ayah': 'ayah_no_telp',
  'status ibu': 'ibu_status_hidup',
  'nama ibu': 'ibu_nama',
  'tanggal lahir ibu': 'ibu_tanggal_lahir',
  'pendidikan ibu': 'ibu_pendidikan',
  'pekerjaan ibu': 'ibu_pekerjaan',
  'penghasilan ibu': 'ibu_penghasilan',
  'no hp ibu': 'ibu_no_telp',
  // NOTE: Education fields handled by anchor-based EDU_OFFSETS below
  // (not here) because "Tanggal" header appears twice and cannot be
  // reliably distinguished by name alone.
};

// Header "Tanggal" muncul 2 kali — tidak bisa dibedakan oleh nama.
// Deteksi posisi dari anchor "lulusan dari", lalu hitung offset relatif.
// Posisi: lulusan_dari +0, tanggal_sttb +1, nomor_sttb +2, lama_belajar +3,
//         pindahan_dari +4, alasan_pindah +5, diangkat +6, kompetensi_keahlian +7,
//         tanggal_diterima +8.
const EDU_SECTION_ANCHOR = 'lulusan dari';
const EDU_OFFSETS: [number, string][] = [
  [0, 'lulusan_dari'],
  [1, 'tanggal_sttb'],
  [2, 'nomor_sttb'],
  [3, 'lama_belajar'],
  [4, 'pindahan_dari'],
  [5, 'alasan_pindah'],
  [6, 'diangkat'],
  [7, 'kompetensi_keahlian'],
  [8, 'tanggal_diterima'],
];

const DAPODIK_DATE_COLUMNS = new Set(['tanggal lahir', 'tanggal lahir ayah', 'tanggal lahir ibu']);
const DAPODIK_ADDRESS_COLUMNS = ['alamat', 'kecamatan', 'kota', 'provinsi'];

export function isDapodikHeader(row: unknown[] | undefined): boolean {
  const cols = new Set((row ?? []).map((c) => String(c ?? '').trim().toLowerCase()));
  return cols.has('nisn') && cols.has('nama siswa');
}

interface DapodikSheetGrid {
  name: string;
  grid: unknown[][];
}

/**
 * Parse sheet DATA MASTER DAPODIK (baris pertama header, baris berikutnya data
 * per siswa) menjadi record dengan key yang sama seperti template BIODATA.
 * Kelas dibiarkan kosong, kewarganegaraan default "Indonesia".
 */
export function parseDapodikSheets(sheets: DapodikSheetGrid[]): { rows: Record<string, string>[]; errors: string[] } {
  const rows: Record<string, string>[] = [];
  const errors: string[] = [];

  for (const { name, grid } of sheets) {
    const header = grid[0] ?? [];
    if (!isDapodikHeader(header)) continue;

    const idx: Record<string, number> = {};
    header.forEach((cell, i) => {
      const col = String(cell ?? '').trim().toLowerCase();
      if (col !== '') idx[col] = i;
    });

    const cell = (cells: unknown[], col: string): string => {
      const i = idx[col];
      const v = i === undefined ? undefined : (cells ?? [])[i];
      return v === null || v === undefined ? '' : String(v).trim();
    };

    grid.slice(1).forEach((cells, i) => {
      const record: Record<string, string> = { class: '' };
      let hasData = false;

      for (const [col, key] of Object.entries(DAPODIK_COLUMN_MAP)) {
        const raw = cell(cells, col);
        if (raw === '') continue;
        hasData = true;
        if (col === 'jenis kelamin') {
          record[key] = normalizeGender(raw);
        } else if (DAPODIK_DATE_COLUMNS.has(col)) {
          record[key] = toDateString(raw);
        } else if (col.startsWith('jarak sekolah')) {
          // Satuan meter — angka dipakai apa adanya.
          const match = raw.match(/^\d+(\.\d+)?/);
          if (!match) continue;
          record[key] = String(Math.round(parseFloat(match[0]) * 100) / 100);
        } else {
          record[key] = raw;
        }
      }

      // Anchor-based mapping for education fields (handles "Tanggal" duplicates).
      const eduAnchorIdx = idx[EDU_SECTION_ANCHOR];
      if (eduAnchorIdx !== undefined) {
        for (const [offset, key] of EDU_OFFSETS) {
          const raw = String((cells ?? [])[eduAnchorIdx + offset] ?? '').trim();
          if (raw === '') continue;
          hasData = true;
          if (['tanggal_sttb', 'tanggal_diterima'].includes(key)) {
            record[key] = toDateString(raw);
          } else {
            record[key] = raw;
          }
        }
      }

      if (!hasData) return;
      const nisn = record.nisn ?? '';
      if (nisn === '') {
        errors.push(`Sheet "${name}" baris ${i + 2}: NISN kosong.`);
        return;
      }

      record.kewarganegaraan = 'Indonesia';
      const address = DAPODIK_ADDRESS_COLUMNS.map((c) => cell(cells, c)).filter(Boolean).join(', ');
      if (address !== '') record.address = address;

      rows.push(record);
    });
  }

  return { rows, errors };
}
