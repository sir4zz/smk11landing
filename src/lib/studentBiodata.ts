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

export const VALID_CLASSES = ['10', '11', '12'];
export const CLASS_OPTIONS = ['', ...VALID_CLASSES];

const CLASS_ROMAN: Record<string, string> = { '10': 'X', '11': 'XI', '12': 'XII' };

export function formatClass(value?: string | null): string {
  return CLASS_ROMAN[value ?? ''] ?? value ?? '-';
}

/** Field yang tidak bisa diubah siswa lewat pengajuan perubahan data. */
export const STUDENT_READONLY_KEYS = new Set([
  'name', 'nisn', 'nis', 'address',
  'place_of_birth', 'date_of_birth', 'anak_ke',
  'ayah_nama', 'ibu_nama',
  'lulusan_dari', 'tanggal_sttb', 'nomor_sttb', 'lama_belajar',
  'pindahan_dari', 'alasan_pindah', 'diangkat', 'kompetensi_keahlian', 'tanggal_diterima',
]);

export function normalizeClass(value: unknown): string {
  const v = String(value ?? '').trim().toUpperCase();
  if (v === 'X' || v === '10') return '10';
  if (v === 'XI' || v === '11') return '11';
  if (v === 'XII' || v === '12') return '12';
  return v;
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
  { key: 'asal_sekolah', label: 'Asal Sekolah', section: 'identity' },
  { key: 'nik', label: 'NIK', section: 'identity', type: 'number' },
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
  { key: 'provinsi', label: 'Provinsi', section: 'residence' },
  { key: 'kota', label: 'Kabupaten / Kota', section: 'residence' },
  { key: 'kecamatan', label: 'Kecamatan', section: 'residence' },
  { key: 'desa', label: 'Desa/Kelurahan', section: 'residence' },
  { key: 'kode_pos', label: 'Kode Pos', section: 'residence', type: 'number' },
  { key: 'phone', label: 'No. Telp / HP', section: 'residence', type: 'number' },
  { key: 'tinggal_dengan', label: 'Tinggal Dengan (Orang Tua/Saudara/Asrama/Kost)', section: 'residence' },
  { key: 'jarak_sekolah', label: 'Jarak Tempat Tinggal ke Sekolah (Km)', section: 'residence', type: 'number' },
  { key: 'jenis_tempat_tinggal', label: 'Jenis Tempat Tinggal', section: 'residence' },
  { key: 'jarak_tempuh', label: 'Jarak Tempuh', section: 'residence' },
  { key: 'transportasi', label: 'Transportasi', section: 'residence' },

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
  { key: 'beasiswa_status', label: 'Menerima Beasiswa', section: 'education', subsection: 'Beasiswa' },
  { key: 'beasiswa_tk', label: 'Tingkat Beasiswa', section: 'education', subsection: 'Beasiswa' },
  { key: 'beasiswa_dari', label: 'Beasiswa Dari', section: 'education', subsection: 'Beasiswa' },

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
  { key: 'email', label: 'Email', section: 'student' },
  { key: 'no_kk', label: 'No. KK', section: 'identity', type: 'number' },
  { key: 'kepala_keluarga', label: 'Kepala Keluarga', section: 'identity' },
  { key: 'no_kip', label: 'No. KIP', section: 'identity', type: 'number' },
  { key: 'cita_cita', label: 'Cita-cita', section: 'hobby' },
  { key: 'hobi', label: 'Hobi', section: 'hobby' },
  { key: 'pernah_paud', label: 'Pernah PAUD', section: 'identity' },
  { key: 'pernah_tk', label: 'Pernah TK', section: 'identity' },
  { key: 'status_afirmasi', label: 'Status Afirmasi', section: 'student' },
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
  'asal sekolah': 'asal_sekolah',
  nik: 'nik',
  email: 'email',
  nisn: 'nisn',
  nis: 'nis',
  kelas: 'class',
  'nama siswa': 'name',
  'nama lengkap': 'name',
  'nama peserta didik': 'name',
  'nama panggilan': 'nickname',
  nama: 'name',
  'tempat lahir': 'place_of_birth',
  'tanggal lahir': 'date_of_birth',
  'jenis kelamin': 'gender',
  'kelamin': 'gender',
  agama: 'religion',
  'anak ke': 'anak_ke',
  'jumlah saudara': 'jml_saudara_kandung',
  'jml saudara kandung': 'jml_saudara_kandung',
  'jml saudara tiri': 'jml_saudara_tiri',
  'anak yatim/piatu': 'anak_yatim_piatu',
  'anak yatim piatu': 'anak_yatim_piatu',
  'kewarganegaraan': 'kewarganegaraan',
  'jurusan': 'major',
  'no hp': 'phone',
  'no kk': 'no_kk',
  'no kip': 'no_kip',
  'kepala keluarga': 'kepala_keluarga',
  'jenis tempat tinggal': 'jenis_tempat_tinggal',
  'jarak tempuh': 'jarak_tempuh',
  transport: 'transportasi',
  'pernah paud': 'pernah_paud',
  'pernah tk': 'pernah_tk',
  'cita cita': 'cita_cita',
  hobi: 'hobi',
  'status afirmasi': 'status_afirmasi',
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
  const cells = (row ?? []).map((c) => String(c ?? '').trim().toLowerCase());
  const nonEmpty = cells.filter(Boolean);
  // Title rows are typically 1-3 cells; real headers have many columns.
  if (nonEmpty.length < 6) return false;
  const cols = new Set(nonEmpty);
  const knownCols = Object.keys(DAPODIK_COLUMN_MAP);
  const matchCount = knownCols.filter((k) => cols.has(k)).length;
  const hasName = cols.has('nama siswa') || cols.has('nama lengkap') || cols.has('nama peserta didik') || cols.has('nama');
  return cols.has('nisn') && hasName && matchCount >= 4;
}

/**
 * Detect the single-sheet multi-row header template:
 * Row N: NO, NIS, KELAS, NISN, JURUSAN, NAMA, KELAMIN, TEMPAT, TANGGAL LAHIR, AGAMA, ...
 * Row N+1: (sub-headers under NAMA): NAMA LENGKAP, NAMA PANGGILAN
 */
export function isMultiRowTemplateHeader(grid: unknown[][]): boolean {
  for (let r = 0; r < Math.min(10, grid.length); r++) {
    const row = grid[r];
    const cols = new Set((row ?? []).map((c) => String(c ?? '').trim().toLowerCase()));
    if (cols.has('nisn') && cols.has('nis') && cols.has('kelamin') && !cols.has('nama siswa')) {
      return true;
    }
  }
  return false;
}

const MULTI_ROW_TEMPLATE_COLUMNS: Record<number, string> = {
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
};

// Header text (lowercase) → field key, used for dynamic column detection.
const HEADER_TEXT_TO_FIELD: Record<string, string> = {
  'nis': 'nis',
  'kelas': 'class',
  'nisn': 'nisn',
  'jurusan': 'major',
  'nama': 'name',
  'nama lengkap': 'name',
  'nama panggilan': 'nickname',
  'kelamin': 'gender',
  'jenis kelamin': 'gender',
  'tempat': 'place_of_birth',
  'tempat lahir': 'place_of_birth',
  'tanggal lahir': 'date_of_birth',
  'agama': 'religion',
  'kewarganegaraan': 'kewarganegaraan',
  'anak ke': 'anak_ke',
  'jml saudara kandung': 'jml_saudara_kandung',
  'jumlah saudara kandung': 'jml_saudara_kandung',
  'jumlah saudara': 'jml_saudara_kandung',
  'jml saudara tiri': 'jml_saudara_tiri',
  'anak yatim/piatu': 'anak_yatim_piatu',
  'anak yatim piatu': 'anak_yatim_piatu',
  'bahasa sehari - hari': 'bahasa_sehari_hari',
  'bahasa sehari-hari': 'bahasa_sehari_hari',
  'tinggal dengan': 'tinggal_dengan',
  'tinggal': 'tinggal_dengan',
  'jarak sekolah': 'jarak_sekolah',
  'jarak tempat': 'jarak_sekolah',
  'golongan darah': 'golongan_darah',
  'penyakit': 'penyakit',
  'kelainan': 'kelainan_jasmani',
  'tinggi': 'tinggi_cm',
  'tinggi(cm)': 'tinggi_cm',
  'tinggi (cm)': 'tinggi_cm',
  'berat': 'berat_kg',
  'berat(kg)': 'berat_kg',
  'berat (kg)': 'berat_kg',
  'lulusan dari': 'lulusan_dari',
  'nomor sttb': 'nomor_sttb',
  'tanggal sttb': 'tanggal_sttb',
  'lama belajar': 'lama_belajar',
  'pindahan dari': 'pindahan_dari',
  'alasan pindah': 'alasan_pindah',
  'diangkat': 'diangkat',
  'kompetensi': 'kompetensi_keahlian',
  'tanggal diterima': 'tanggal_diterima',
  'no hp': 'phone',
  'no telp/hp': 'phone',
  'no telp': 'phone',
  'email': 'email',
  'no kk': 'no_kk',
  'kepala keluarga': 'kepala_keluarga',
  'alamat': 'address',
  'asal sekolah': 'asal_sekolah',
  'nik': 'nik',
  'provinsi': 'provinsi',
  'kota': 'kota',
  'kecamatan': 'kecamatan',
  'desa': 'desa',
  'kode pos': 'kode_pos',
  'no kip': 'no_kip',
  'jenis tempat tinggal': 'jenis_tempat_tinggal',
  'jarak tempuh': 'jarak_tempuh',
  'transport': 'transportasi',
  'pernah paud': 'pernah_paud',
  'pernah tk': 'pernah_tk',
  'status afirmasi': 'status_afirmasi',
  'cita cita': 'cita_cita',
  'hobi': 'hobi',
  'menerima bea siswa': 'beasiswa_status',
  'tk': 'beasiswa_tk',
  'dari': 'beasiswa_dari',
  'nama ayah': 'ayah_nama',
  'nama ibu': 'ibu_nama',
  'nama wali': 'wali_nama',
};

/** Build a column-index → field-key map from a header row. */
function buildDynamicColumnMap(header: unknown[]): Record<number, string> {
  const result: Record<number, string> = {};
  const normalized = header.map(h => String(h ?? '').trim().toLowerCase());
  const used = new Set<number>();

  const sortedKeys = Object.keys(HEADER_TEXT_TO_FIELD).sort((a, b) => b.length - a.length);
  for (const text of sortedKeys) {
    const field = HEADER_TEXT_TO_FIELD[text];
    // Exact match first.
    let ki = normalized.findIndex((h, i) => !used.has(i) && h === text);
    // Substring match at word boundary.
    if (ki < 0) {
      ki = normalized.findIndex((h, i) => {
        if (used.has(i)) return false;
        const idx = h.indexOf(text);
        if (idx < 0) return false;
        const before = idx > 0 ? h[idx - 1] : ' ';
        const after = idx + text.length < h.length ? h[idx + text.length] : ' ';
        return /[\s(]/.test(before) && /[\s)]/.test(after);
      });
    }
    if (ki >= 0) {
      result[ki] = field;
      used.add(ki);
    }
  }
  return result;
}

export function parseMultiRowTemplate(grid: unknown[][]): { rows: Record<string, string>[]; errors: string[] } {
  const rows: Record<string, string>[] = [];
  const errors: string[] = [];

  let headerIdx = -1;
  for (let r = 0; r < Math.min(10, grid.length); r++) {
    const cols = new Set((grid[r] ?? []).map((c) => String(c ?? '').trim().toLowerCase()));
    if (cols.has('nisn') && cols.has('kelamin') && !cols.has('nama siswa')) {
      headerIdx = r;
      break;
    }
  }
  if (headerIdx < 0) return { rows, errors };

  // Build dynamic column map from the first sub-header row (headerIdx).
  const dynamicColumns = buildDynamicColumnMap(grid[headerIdx] ?? []);

  // Detect group headers row (one row above headerIdx) for parent sections.
  const groupRow = grid[headerIdx - 1] ?? [];
  const parentGroupMap: Record<number, string> = {};
  for (let c = 0; c < groupRow.length; c++) {
    const g = String(groupRow[c] ?? '').trim().toLowerCase();
    if (g.includes('ayah')) parentGroupMap[c] = 'ayah';
    else if (g.includes('ibu')) parentGroupMap[c] = 'ibu';
    else if (g.includes('wali')) parentGroupMap[c] = 'wali';
  }

  // Parent sub-header field mapping (lowercase header text → field suffix).
  const PARENT_SUB_MAP: Record<string, string> = {
    'nama': '_nama',
    'tempat': '_tempat',
    'tanggal lahir': '_tanggal_lahir',
    'agama': '_agama',
    'kewarganegaraan': '_kewarganegaraan',
    'pendidikan': '_pendidikan',
    'pekerjaan': '_pekerjaan',
    'penghasilan per bulan': '_penghasilan',
    'penghasilan': '_penghasilan',
    'alamat rumah': '_alamat',
    'alamat': '_alamat',
    'no. hp/telp': '_no_telp',
    'no.telp/hp': '_no_telp',
    'no hp': '_no_telp',
    'masih hidup/meninggal dunia tahun': '_status_hidup',
    'masih hidup/meninggal': '_status_hidup',
  };

  // Also scan the row below headerIdx for parent sub-headers.
  const subHeaderRow = grid[headerIdx + 1] ?? [];
  // Determine which group each column belongs to using parentGroupMap.
  // Cover all columns up to the last group header, not just those in dynamicColumns.
  const colToGroup: Record<number, string> = {};
  const groupKeys = Object.keys(parentGroupMap).map(Number).sort((a, b) => a - b);
  for (let col = 0; col < 200; col++) {
    for (let gi = 0; gi < groupKeys.length; gi++) {
      const start = groupKeys[gi];
      const end = gi < groupKeys.length - 1 ? groupKeys[gi + 1] : 999;
      if (col >= start && col < end) {
        colToGroup[col] = parentGroupMap[start]!;
        break;
      }
    }
  }

  // Resolve parent sub-headers from the second header row.
  const sortedSubKeys = Object.keys(PARENT_SUB_MAP).sort((a, b) => b.length - a.length);
  for (let c = 0; c < subHeaderRow.length; c++) {
    const h = String(subHeaderRow[c] ?? '').trim().toLowerCase();
    if (!h) continue;
    const parent = colToGroup[c];
    if (!parent) continue;
    for (const subKey of sortedSubKeys) {
      if (h === subKey || h.includes(subKey)) {
        dynamicColumns[c] = parent + PARENT_SUB_MAP[subKey];
        break;
      }
    }
  }

  // Also scan row below that (headerIdx + 2) for additional sub-headers.
  const subHeaderRow2 = grid[headerIdx + 2] ?? [];
  for (let c = 0; c < subHeaderRow2.length; c++) {
    const h = String(subHeaderRow2[c] ?? '').trim().toLowerCase();
    if (!h) continue;
    const parent = colToGroup[c];
    if (!parent) continue;
    if (dynamicColumns[c]) continue; // already mapped
    for (const subKey of sortedSubKeys) {
      if (h === subKey || h.includes(subKey)) {
        dynamicColumns[c] = parent + PARENT_SUB_MAP[subKey];
        break;
      }
    }
  }

  // SUMMARY menyimpan pendidikan dalam kolom gabungan sehingga nama field
  // sebenarnya berada di baris sub-header berikutnya. Gunakan anchor agar
  // dua kolom tanggal STTB dan tanggal diterima tidak tertukar.
  const educationAnchor = (grid[headerIdx] ?? []).findIndex((value) =>
    String(value ?? '').trim().toLowerCase() === 'pendidikan sebelumnya',
  );
  if (educationAnchor >= 0) {
    const educationFields = [
      'lulusan_dari', 'tanggal_sttb', 'nomor_sttb', 'lama_belajar',
      'pindahan_dari', 'alasan_pindah', 'diangkat', 'kompetensi_keahlian',
      'tanggal_diterima',
    ];
    educationFields.forEach((field, offset) => {
      dynamicColumns[educationAnchor + offset] = field;
    });
  }

  // Field setelah section orang tua berada di baris sub-header yang sama.
  // Map berdasarkan label dan posisi section, bukan berdasarkan nama global
  // karena beberapa label (misalnya "Tanggal") muncul lebih dari sekali.
  const mapLabeledColumns = (row: unknown[], start: number, end: number, labels: Record<string, string>) => {
    for (let c = start; c < Math.min(end, row.length); c++) {
      const label = String(row[c] ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
      const field = labels[label];
      if (field) dynamicColumns[c] = field;
    }
  };
  const summaryLabels: Record<string, string> = {
    kesenian: 'gemar_kesenian',
    'olah raga': 'gemar_olahraga',
    olahraga: 'gemar_olahraga',
    kemasyarakatan: 'gemar_kemasyarakatan',
    'lain-lain': 'gemar_lain',
    'menerima bea siswa': 'beasiswa_status',
    tk: 'beasiswa_tk',
    dari: 'beasiswa_dari',
    status: 'siswa_status',
    tanggal: 'siswa_tanggal',
  };
  const hobbyStart = groupRow.findIndex((value) => String(value ?? '').trim().toLowerCase().includes('kegemaran siswa'));
  const studentStart = groupRow.findIndex((value) => String(value ?? '').trim().toLowerCase() === 'keterangan siswa');
  if (hobbyStart >= 0) {
    mapLabeledColumns(subHeaderRow, hobbyStart, studentStart >= 0 ? studentStart : hobbyStart + 4, summaryLabels);
  }
  if (studentStart >= 0) mapLabeledColumns(subHeaderRow, studentStart, studentStart + 2, summaryLabels);

  // If dynamic detection found at least NISN + NAMA + KELAMIN, use it.
  // Otherwise fall back to fixed MULTI_ROW_TEMPLATE_COLUMNS.
  const hasDynamic = Object.values(dynamicColumns).some(f => f === 'nisn')
    && Object.values(dynamicColumns).some(f => f === 'name')
    && Object.values(dynamicColumns).some(f => f === 'gender');
  const columnMap = hasDynamic
    ? Object.fromEntries(Object.entries(dynamicColumns).map(([k, v]) => [Number(k), v]))
    : MULTI_ROW_TEMPLATE_COLUMNS;

  // Data starts after header rows — skip any row that's all numbers.
  let dataStart = headerIdx + 1;
  for (let r = headerIdx + 1; r < Math.min(headerIdx + 5, grid.length); r++) {
    const cells = grid[r] ?? [];
    const nonEmpty = cells.filter((c) => c !== '' && c !== null && c !== undefined);
    if (nonEmpty.length === 0) continue;
    const allNumeric = nonEmpty.every((c) => /^\d+$/.test(String(c).trim()));
    if (allNumeric) { dataStart = r + 1; continue; }
    dataStart = r;
    break;
  }

  grid.slice(dataStart).forEach((cells) => {
    const out: Record<string, string> = {};
    for (const [colIdx, key] of Object.entries(columnMap)) {
      const value = cells[Number(colIdx)];
      if (value === null || value === undefined || String(value).trim() === '') continue;
      if (key === 'gender') {
        out.gender = normalizeGender(value);
      } else if (key === 'class') {
        out.class = normalizeClass(value);
      } else if (DATE_KEYS.has(key)) {
        out[key] = toDateString(value);
      } else if (RUPIAH_KEYS.has(key)) {
        out[key] = String(value).replace(/[^\d]/g, '');
      } else {
        out[key] = String(value).trim();
      }
    }

    const nisn = (out.nisn ?? '').trim().replace(/^'+/, '');
    if (!nisn) return;
    // Skip non-numeric or very short NISNs (sub-header rows like "NAMA LENGKAP").
    if (!/^\d{4,}$/.test(nisn)) return;

    rows.push(out);
  });

  return { rows, errors };
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
  const resolvedMap = new Map<string, Record<string, string>>();
  const errors: string[] = [];

  for (const { grid } of sheets) {
    // Find the actual header row by scanning first 15 rows.
    let headerIdx = 0;
    for (let r = 0; r < Math.min(15, grid.length); r++) {
      if (isDapodikHeader(grid[r])) { headerIdx = r; break; }
    }
    const header = grid[headerIdx] ?? [];
    if (!isDapodikHeader(header)) continue;

    const normalizedHeaders = (header ?? []).map(h => String(h ?? '').trim().toLowerCase());
    const usedHeaders = new Set<number>();
    const resolvedIdx: Record<string, number> = {};

    // Sort keys longest-first so "nama peserta didik" matches before "nama", "nisn" before "nis".
    const sortedKeys = Object.keys(DAPODIK_COLUMN_MAP).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      // 1) Exact match.
      let ki = normalizedHeaders.findIndex((h, i) => !usedHeaders.has(i) && h === key);
      // 2) Header contains key at word boundary.
      if (ki < 0) {
        ki = normalizedHeaders.findIndex((h, i) => {
          if (usedHeaders.has(i)) return false;
          const idx = h.indexOf(key);
          if (idx < 0) return false;
          const before = idx > 0 ? h[idx - 1] : ' ';
          const after = idx + key.length < h.length ? h[idx + key.length] : ' ';
          return /[\s(]/.test(before) && /[\s)]/.test(after);
        });
      }
      if (ki >= 0) {
        resolvedIdx[key] = ki;
        usedHeaders.add(ki);
      }
    }
    // Also resolve the education anchor (not in DAPODIK_COLUMN_MAP).
    const eduKi = normalizedHeaders.findIndex((h, i) => !usedHeaders.has(i) && (
      h === EDU_SECTION_ANCHOR || (() => {
        const idx = h.indexOf(EDU_SECTION_ANCHOR);
        if (idx < 0) return false;
        const before = idx > 0 ? h[idx - 1] : ' ';
        const after = idx + EDU_SECTION_ANCHOR.length < h.length ? h[idx + EDU_SECTION_ANCHOR.length] : ' ';
        return /[\s(]/.test(before) && /[\s)]/.test(after);
      })()
    ));
    if (eduKi >= 0) resolvedIdx[EDU_SECTION_ANCHOR] = eduKi;

    const cell = (cells: unknown[], col: string): string => {
      const i = resolvedIdx[col];
      const v = i === undefined ? undefined : (cells ?? [])[i];
      return v === null || v === undefined ? '' : String(v).trim();
    };

    grid.slice(headerIdx + 1).forEach((cells) => {
      const record: Record<string, string> = { class: '' };
      let hasData = false;

      for (const [col, key] of Object.entries(DAPODIK_COLUMN_MAP)) {
        const raw = cell(cells, col);
        if (raw === '') continue;
        hasData = true;
        if (col === 'jenis kelamin' || col === 'kelamin') {
          record[key] = normalizeGender(raw);
        } else if (key === 'class') {
          record[key] = normalizeClass(raw);
        } else if (DAPODIK_DATE_COLUMNS.has(col)) {
          record[key] = toDateString(raw);
        } else if (col.startsWith('jarak sekolah')) {
          const match = raw.match(/^\d+(\.\d+)?/);
          if (!match) continue;
          let val = parseFloat(match[0]);
          if (val > 1000) val = Math.round(val / 1000 * 100) / 100;
          record[key] = String(val);
        } else if (RUPIAH_KEYS.has(key)) {
          record[key] = raw.replace(/[^\d]/g, '');
        } else {
          record[key] = raw;
        }
      }

      // Anchor-based mapping for education fields (handles "Tanggal" duplicates).
      const eduAnchorIdx = resolvedIdx[EDU_SECTION_ANCHOR];
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
      const nisn = (record.nisn ?? '').replace(/^'+/, '');
      // Rows without NISN (footer/summary rows) — silently skip.
      if (!nisn) return;
      // Skip column-number rows (1, 2, 3...) and very short NISNs.
      if (/^\d{1,3}$/.test(nisn)) return;
      record.nisn = nisn;

      record.kewarganegaraan = 'Indonesia';
      const address = DAPODIK_ADDRESS_COLUMNS.map((c) => cell(cells, c)).filter(Boolean).join(', ');
      if (address !== '') record.address = address;

      // Merge by NISN: keep the most complete record (prefer non-empty values).
      const existing = resolvedMap.get(nisn);
      if (existing) {
        for (const [k, v] of Object.entries(record)) {
          if (v && v !== '' && v !== '0' && (!existing[k] || existing[k] === '' || existing[k] === '0')) {
            existing[k] = v;
          }
        }
      } else {
        resolvedMap.set(nisn, { ...record });
      }
    });
  }

  return { rows: Array.from(resolvedMap.values()), errors };
}
