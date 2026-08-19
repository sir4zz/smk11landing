// Definisi kolom BIODATA PESERTA DIDIK BARU (76 kolom, 10 seksi).
// Dipakai bersama oleh StudentsManagement (form) dan StudentImportModal (import).

export interface BiodataFieldDef {
  key: string;
  label: string;
  section: string;
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
  ];
}

export const BIODATA_FIELDS: BiodataFieldDef[] = [
  // A. Keterangan Peserta Didik
  { key: 'nisn', label: 'NISN', section: 'identity', placeholder: 'cth. 0061234567', type: 'number' },
  { key: 'nis', label: 'NIS', section: 'identity', placeholder: 'cth. 12345', type: 'number' },
  { key: 'name', label: 'Nama Lengkap', section: 'identity', full: true },
  { key: 'nickname', label: 'Nama Panggilan', section: 'identity' },
  { key: 'class', label: 'Kelas', section: 'identity', placeholder: 'cth. X TJKT 1' },
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
  { key: 'jarak_sekolah', label: 'Jarak Tempat Tinggal ke Sekolah (KM)', section: 'residence', type: 'decimal' },

  // C. Keterangan Kesehatan
  { key: 'golongan_darah', label: 'Golongan Darah', section: 'health', type: 'select', options: BLOOD_OPTIONS },
  { key: 'penyakit', label: 'Penyakit yang Pernah Diderita', section: 'health', type: 'textarea' },
  { key: 'kelainan_jasmani', label: 'Kelainan Jasmani', section: 'health', type: 'textarea' },
  { key: 'tinggi_cm', label: 'Tinggi (cm)', section: 'health', type: 'number' },
  { key: 'berat_kg', label: 'Berat (kg)', section: 'health', type: 'number' },

  // D. Keterangan Pendidikan
  { key: 'lulusan_dari', label: 'Pendidikan Sebelumnya (Lulusan Dari)', section: 'education' },
  { key: 'tanggal_sttb', label: 'Tanggal STTB/Ijazah', section: 'education', type: 'date' },
  { key: 'nomor_sttb', label: 'Nomor STTB/Ijazah', section: 'education', type: 'number' },
  { key: 'lama_belajar', label: 'Lama Belajar (Tahun)', section: 'education', type: 'number' },
  { key: 'pindahan_dari', label: 'Pindahan Dari Sekolah', section: 'education' },
  { key: 'alasan_pindah', label: 'Alasan Pindah', section: 'education' },
  { key: 'diangkat', label: 'Diangkat', section: 'education' },
  { key: 'kompetensi_keahlian', label: 'Kompetensi/Keahlian', section: 'education' },
  { key: 'tanggal_diterima', label: 'Tanggal Diterima di Sekolah Ini', section: 'education', type: 'date' },

  // E. Ayah
  ...parentFields('ayah', 'father'),
  // F. Ibu
  ...parentFields('ibu', 'mother'),
  // G. Wali
  ...parentFields('wali', 'guardian'),
  { key: 'wali_status_hidup', label: 'Masih Hidup/Meninggal', section: 'guardian' },

  // H. Kegemaran Siswa
  { key: 'gemar_kesenian', label: 'Kesenian', section: 'hobby' },
  { key: 'gemar_olahraga', label: 'Olahraga', section: 'hobby' },
  { key: 'gemar_kemasyarakatan', label: 'Kemasyarakatan', section: 'hobby' },
  { key: 'gemar_lain', label: 'Lain-lain', section: 'hobby' },

  // I. Keterangan Siswa
  { key: 'siswa_status', label: 'Status', section: 'student' },
  { key: 'siswa_tanggal', label: 'Tanggal', section: 'student', type: 'date' },
];

// Field yang wajib dalam bentuk apa pun.
export const REQUIRED_KEYS = ['nisn', 'name'];

// Pemetaan posisi kolom (0-based) template BIODATA ke key DB.
// Data template: baris 1-7 adalah header 3 lapis, baris ke-8 adalah nomor kolom.
// Baris data dimulai dari index 8.
export const TEMPLATE_COLUMNS: Record<number, string> = {
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
  17: 'address',
  18: 'phone',
  19: 'tinggal_dengan',
  20: 'jarak_sekolah',
  21: 'golongan_darah',
  22: 'penyakit',
  23: 'kelainan_jasmani',
  24: 'tinggi_cm',
  25: 'berat_kg',
  26: 'lulusan_dari',
  27: 'tanggal_sttb',
  28: 'nomor_sttb',
  29: 'lama_belajar',
  30: 'pindahan_dari',
  31: 'alasan_pindah',
  32: 'diangkat',
  33: 'kompetensi_keahlian',
  34: 'tanggal_diterima',
  35: 'ayah_nama',
  36: 'ayah_tempat',
  37: 'ayah_tanggal_lahir',
  38: 'ayah_agama',
  39: 'ayah_kewarganegaraan',
  40: 'ayah_pendidikan',
  41: 'ayah_pekerjaan',
  42: 'ayah_penghasilan',
  43: 'ayah_alamat',
  44: 'ayah_no_telp',
  45: 'ayah_status_hidup',
  46: 'ibu_nama',
  47: 'ibu_tempat',
  48: 'ibu_tanggal_lahir',
  49: 'ibu_agama',
  50: 'ibu_kewarganegaraan',
  51: 'ibu_pendidikan',
  52: 'ibu_pekerjaan',
  53: 'ibu_penghasilan',
  54: 'ibu_alamat',
  55: 'ibu_no_telp',
  56: 'ibu_status_hidup',
  57: 'wali_nama',
  58: 'wali_tempat',
  59: 'wali_tanggal_lahir',
  60: 'wali_agama',
  61: 'wali_kewarganegaraan',
  62: 'wali_pendidikan',
  63: 'wali_pekerjaan',
  64: 'wali_penghasilan',
  65: 'wali_alamat',
  66: 'wali_no_telp',
  67: 'gemar_kesenian',
  68: 'gemar_olahraga',
  69: 'gemar_kemasyarakatan',
  70: 'gemar_lain',
  71: 'siswa_status',
  72: 'siswa_tanggal',
};

// Baris header template (index 0-7), data mulai index 8.
export const TEMPLATE_HEADER_ROWS = 8;

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
