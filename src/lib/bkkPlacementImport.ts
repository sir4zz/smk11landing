/**
 * Parser for the BKK placement report XLSX ("format_penempatan ... .xlsx").
 *
 * Layout of the official format:
 * - Row 0..3 : title / blank rows ("LAPORAN PENEMPATAN BURSA KERJA KHUSUS", "TAHUN 2025", ...)
 * - Row 4    : header (NO, BULAN, NAMA SEKOLAH, ..., NAMA PERUSAHAAN, ... )
 * - Row 5    : numbering (1..23)
 * - Row 6+   : data rows
 *
 * The header row is located dynamically and columns are matched by name so
 * small variations (extra title rows, typos like "JANIS UASAHA") still parse.
 */

export interface BkkPlacementImportRow {
  __line: number;
  month: string;
  school_name: string;
  alumni_name: string;
  gender: string;
  birth_place: string;
  birth_date: string;
  nik: string;
  ak1_no: string;
  address: string;
  district: string;
  province: string;
  regency: string;
  email: string;
  major: string;
  position: string;
  status: string;
  company_name: string;
  company_business_type: string;
  business_field: string;
  company_address: string;
  company_province: string;
  company_regency: string;
}

export interface BkkPlacementParseResult {
  rows: BkkPlacementImportRow[];
  warnings: string[];
}

function clean(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value).trim();
  return s === '-' ? '' : s;
}

function normHeader(value: unknown): string {
  return clean(value).toUpperCase().replace(/\s+/g, ' ').replace(/\./g, '').trim();
}

function pad2(n: number | string): string {
  return String(n).padStart(2, '0');
}

const MONTHS: Record<string, string> = {
  JANUARI: '01', FEBRUARI: '02', MARET: '03', APRIL: '04', MEI: '05',
  JUNI: '06', JULI: '07', AGUSTUS: '08', SEPTEMBER: '09', OKTOBER: '10',
  NOVEMBER: '11', DESEMBER: '12',
};

/** Normalize to ISO date when possible; otherwise keep the raw string. */
function normalizeBirthDate(value: unknown): string {
  const raw = clean(value);
  if (!raw) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
  }

  let m = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) return `${m[3]}-${pad2(m[2])}-${pad2(m[1])}`;

  m = raw.toUpperCase().match(/^(\d{1,2})\s+([A-Z]+)\s+(\d{4})$/);
  if (m && MONTHS[m[2]]) return `${m[3]}-${MONTHS[m[2]]}-${pad2(m[1])}`;

  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  return raw;
}

function normalizeGender(value: unknown): string {
  const s = clean(value).toUpperCase();
  if (!s) return '';
  if (/^(L|LK|LAKI(-|\s)?LAKI|PRIA)$/.test(s)) return 'Laki-laki';
  if (/^(P|PR|PEREMPUAN|WANITA)$/.test(s)) return 'Perempuan';
  return clean(value);
}

type ColumnKey =
  | 'month' | 'school_name' | 'alumni_name' | 'gender' | 'birth_place'
  | 'birth_date' | 'nik' | 'ak1_no' | 'address' | 'district' | 'province'
  | 'regency' | 'email' | 'major' | 'position' | 'status' | 'company_name'
  | 'company_business_type' | 'business_field' | 'company_address'
  | 'company_province' | 'company_regency';

function mapHeaders(headerRow: unknown[]): Partial<Record<ColumnKey, number>> | null {
  const seenAddress = new Set<ColumnKey>();
  const seenProvince = new Set<ColumnKey>();
  const seenRegency = new Set<ColumnKey>();
  const map: Partial<Record<ColumnKey, number>> = {};
  let foundName = false;

  headerRow.forEach((cell, idx) => {
    const h = normHeader(cell);
    if (!h || h === 'NO') return;

    if (h.includes('NAMA ALUMNI')) { map.alumni_name = idx; foundName = true; }
    else if (h.includes('BULAN')) { map.month = idx; }
    else if (h.includes('NAMA SEKOLAH')) { map.school_name = idx; }
    else if (h.includes('KELAMIN')) { map.gender = idx; }
    else if (h.includes('TEMPAT LAHIR')) { map.birth_place = idx; }
    else if (h.includes('TANGGAL LAHIR')) { map.birth_date = idx; }
    else if (h === 'NIK') { map.nik = idx; }
    else if (/^NO AK/.test(h)) { map.ak1_no = idx; }
    else if (h.startsWith('ALAMAT')) {
      if (!seenAddress.has('address')) { map.address = idx; seenAddress.add('address'); }
      else { map.company_address = idx; seenAddress.add('company_address'); }
    }
    else if (h.includes('KECAMATAN')) { map.district = idx; }
    else if (h.includes('PROVINSI')) {
      if (!seenProvince.has('province')) { map.province = idx; seenProvince.add('province'); }
      else { map.company_province = idx; seenProvince.add('company_province'); }
    }
    else if (/^KAB/.test(h) || /^KOTA/.test(h)) {
      if (!seenRegency.has('regency')) { map.regency = idx; seenRegency.add('regency'); }
      else { map.company_regency = idx; seenRegency.add('company_regency'); }
    }
    else if (h === 'EMAIL') { map.email = idx; }
    else if (h.includes('JURUSAN')) { map.major = idx; }
    else if (h.includes('JABATAN')) { map.position = idx; }
    else if (h === 'STATUS') { map.status = idx; }
    else if (h.includes('NAMA PERUSAHAAN')) { map.company_name = idx; }
    else if (h.replace(/[^A-Z]/g, '').includes('LAPANGAN')) { map.business_field = idx; }
    else if (/(JENIS|JANIS)/.test(h)) { map.company_business_type = idx; }
  });

  return foundName ? map : null;
}

export async function parseBkkPlacementWorkbook(file: File): Promise<BkkPlacementParseResult> {
  const XLSX = await import('xlsx');
  // cellDates:true makes date cells come back as Date instances.
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });

  const warnings: string[] = [];
  const rows: BkkPlacementImportRow[] = [];

  for (const sheetName of wb.SheetNames) {
    const grid: unknown[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' });

    let headerIdx = -1;
    let cols: Partial<Record<ColumnKey, number>> | null = null;
    for (let i = 0; i < Math.min(grid.length, 20); i++) {
      cols = mapHeaders(grid[i] ?? []);
      if (cols) { headerIdx = i; break; }
    }
    if (headerIdx === -1 || !cols) continue;

    for (let i = headerIdx + 1; i < grid.length; i++) {
      const r = grid[i] ?? [];
      // Skip the numbering row under the header (all numeric cells).
      const isNumbering = r.every((c) => c !== null && c !== undefined && String(c).trim() !== '' && !Number.isNaN(Number(c)));
      if (isNumbering) continue;

      const get = (key: ColumnKey): unknown => {
        const idx = cols![key];
        return idx === undefined ? '' : r[idx];
      };

      const alumniName = clean(get('alumni_name'));
      if (!alumniName) continue;

      rows.push({
        __line: i + 1,
        month: clean(get('month')).toUpperCase(),
        school_name: clean(get('school_name')),
        alumni_name: alumniName,
        gender: normalizeGender(get('gender')),
        birth_place: clean(get('birth_place')),
        birth_date: normalizeBirthDate(get('birth_date')),
        nik: clean(get('nik')).replace(/[\s.]/g, ''),
        ak1_no: clean(get('ak1_no')),
        address: clean(get('address')),
        district: clean(get('district')),
        province: clean(get('province')),
        regency: clean(get('regency')),
        email: clean(get('email')).toLowerCase(),
        major: clean(get('major')),
        position: clean(get('position')),
        status: clean(get('status')),
        company_name: clean(get('company_name')),
        company_business_type: clean(get('company_business_type')),
        business_field: clean(get('business_field')),
        company_address: clean(get('company_address')),
        company_province: clean(get('company_province')),
        company_regency: clean(get('company_regency')),
      });
    }

    if (rows.length > 0) {
      warnings.push(`Sheet "${sheetName}": ${rows.length} baris terbaca.`);
      break;
    }
  }

  if (rows.length === 0) {
    warnings.push('Tidak ada baris data yang dikenali. Pastikan file menggunakan format laporan penempatan BKK (kolom NAMA ALUMNI).');
  }

  return { rows, warnings };
}

/** Download an empty XLSX template following the official penempatan layout. */
export async function downloadPlacementTemplate(): Promise<void> {
  const XLSX = await import('xlsx');
  const headers = [
    'NO', 'BULAN', 'NAMA SEKOLAH', 'NAMA ALUMNI', 'JENIS KELAMIN', 'TEMPAT LAHIR',
    'TANGGAL LAHIR', 'NIK', 'NO AK.I', 'ALAMAT', 'KECAMATAN', 'PROVINSI', 'KAB/KOTA',
    'EMAIL', 'JURUSAN', 'JABATAN', 'STATUS', 'NAMA PERUSAHAAN', 'JENIS USAHA',
    'LAPANGAN USAHA', 'ALAMAT ', 'PROVINSI ', 'KAB/KOTA ',
  ];
  const example = [
    1, 'JULI', 'SMKN 11 KAB. TANGERANG', 'Contoh Nama', 'Perempuan', 'Tangerang',
    '07 September 2001', '3603024710010002', '', 'Alamat alumni', 'Jayanti', 'BANTEN', 'TANGERANG',
    'email@contoh.com', 'DPB', 'OPERATOR', 'BEKERJA', 'PT Contoh', 'Manufaktur',
    'Manufaktur', 'Alamat perusahaan', 'BANTEN', 'TANGERANG',
  ];
  const ws = XLSX.utils.aoa_to_sheet([
    ['LAPORAN PENEMPATAN BURSA KERJA KHUSUS'],
    [`TAHUN ${new Date().getFullYear()}`],
    [],
    [],
    headers,
    headers.map((_, i) => i + 1),
    example,
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, 'template_penempatan_bkk.xlsx');
}
