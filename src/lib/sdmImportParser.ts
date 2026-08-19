import type { SdmPersonRow } from './api';

/**
 * Parser for the SDM Excel file "DATA GURU, TU ..." published by SMKN 11.
 *
 * Layout (same for Guru Hal.1-12 and TU Hal.13-18):
 * - Row 0   : title ("DATA PENDIDIK (GURU)" / "DATA TENAGA KEPENDIDIKAN")
 * - Row 4-5 : merged header, data rows start at index 6.
 *
 * Guru sheets: Hal.1-2 main, Hal.3-4 KGB+Pendidikan, Hal.5-6 Tugas,
 * Hal.7-8 Sertifikasi, Hal.9-10 Kontak, Hal.11-12 SK Pengangkatan.
 * TU sheets have the same layout in Hal.13-18.
 *
 * Persons are keyed by normalized name so rows from every sheet merge into
 * one record per person. The combined "NIP, NIPPPK" column is routed to
 * `nipppk` when the STATUS column says PPPK, otherwise to `nip`.
 */

export type SdmStaffType = 'guru' | 'tendik';

export interface SdmParseResult {
  guru: SdmPersonRow[];
  tendik: SdmPersonRow[];
  warnings: string[];
}

const STAFF_TYPE_LABELS: Record<SdmStaffType, string> = {
  guru: 'Guru',
  tendik: 'Tenaga Kependidikan',
};

function clean(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value).trim();
  return s === '-' ? '' : s;
}

function cleanId(value: unknown): string {
  return clean(value).replace(/[\s.\t-]/g, '');
}

function pad2(n: number | string): string {
  return String(n).padStart(2, '0');
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

const MONTHS: Record<string, string> = {
  JANUARI: '01', FEBRUARI: '02', MARET: '03', APRIL: '04', MEI: '05',
  JUNI: '06', JULI: '07', AGUSTUS: '08', SEPTEMBER: '09', OKTOBER: '10',
  NOVEMBER: '11', DESEMBER: '12',
};

export function normalizeDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return toISODate(value);
  }
  const s = String(value).trim();
  if (!s || s === '-') return null;

  let m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.]([0-9]{4})$/);
  if (m) return `${m[3]}-${pad2(m[2])}-${pad2(m[1])}`;

  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${pad2(m[2])}-${pad2(m[3])}`;

  const month = s.toUpperCase().match(/(\d{1,2})\s+([A-Z]+)\s+(\d{4})/);
  if (month && MONTHS[month[2]]) {
    return `${month[3]}-${MONTHS[month[2]]}-${pad2(month[1])}`;
  }

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return toISODate(d);
  return null;
}

function normalizeGender(value: unknown): string {
  const s = clean(value).toUpperCase();
  if (!s) return '';
  if (s === 'L' || s === 'LK' || s === 'LAKI' || s === 'LAKI-LAKI' || s === 'PRIA') return 'Laki-laki';
  if (s === 'P' || s === 'PR' || s === 'PEREMPUAN' || s === 'WANITA') return 'Perempuan';
  return clean(value);
}

function nameKey(value: unknown): string {
  return clean(value).toUpperCase().replace(/\s+/g, ' ');
}

function parseIntClean(value: unknown): number | null {
  const s = clean(value).replace(/\D/g, '');
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? null : n;
}

function splitBirth(value: unknown): { place: string; date: string | null } {
  const raw = clean(value);
  if (!raw) return { place: '', date: null };
  const comma = raw.indexOf(',');
  if (comma > -1) {
    const place = raw.slice(0, comma).trim();
    const date = normalizeDate(raw.slice(comma + 1).trim());
    return { place, date };
  }
  const date = normalizeDate(raw);
  if (date) {
    const place = raw.replace(/[\d\s./-]+/g, '').trim();
    return { place, date };
  }
  return { place: raw, date: null };
}

type SheetKind = 'main' | 'kgb' | 'assignment' | 'certification' | 'contact' | 'sk';

interface SheetInfo {
  staffType: SdmStaffType;
  kind: SheetKind;
}

function classifySheet(rows: unknown[][]): SheetInfo | null {
  const title = clean(rows[0]?.[0]);
  const header = rows[4]?.map((v) => clean(v)).join(' ').toUpperCase() ?? '';

  let staffType: SdmStaffType;
  if (/TENAGA KEPENDIDIKAN/.test(title)) staffType = 'tendik';
  else if (/PENDIDIK \(GURU\)/.test(title) || /GURU/.test(title)) staffType = 'guru';
  else return null;

  let kind: SheetKind;
  if (header.includes('GAJI BERKALA')) kind = 'kgb';
  else if (header.includes('SERTIFIKASI')) kind = 'certification';
  else if (header.includes('NIK KTP')) kind = 'contact';
  else if (header.includes('SK PENGANGKATAN')) kind = 'sk';
  else if (header.includes('JABATAN / TUGAS') || header.includes('TUGAS POKOK')) kind = 'assignment';
  else if (header.includes('NAMA LENGKAP') && header.includes('NIP')) kind = 'main';
  else return null;

  return { staffType, kind };
}

function buildMergeTargets(persons: SdmPersonRow[]): Map<string, SdmPersonRow> {
  const map = new Map<string, SdmPersonRow>();
  const seen = new Map<string, number>();
  for (const person of persons) {
    const base = nameKey(person.name);
    const occurrence = (seen.get(base) ?? 0) + 1;
    seen.set(base, occurrence);
    const key = occurrence === 1 ? base : `${base}#${occurrence}`;
    map.set(key, person);
  }
  return map;
}

function sheetRows(XLSX: typeof import('xlsx'), ws: unknown): unknown[][] {
  return XLSX.utils.sheet_to_json<unknown[]>(ws as never, { header: 1, defval: '' });
}

export async function parseSdmWorkbook(file: File): Promise<SdmParseResult> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });

  const warnings: string[] = [];
  const guru: SdmPersonRow[] = [];
  const tendik: SdmPersonRow[] = [];
  const mainRows = new Map<SdmStaffType, unknown[][]>();

  for (const sheetName of wb.SheetNames) {
    const rows = sheetRows(XLSX, wb.Sheets[sheetName]);
    if (!rows || rows.length < 7) continue;
    const info = classifySheet(rows);
    if (!info) {
      warnings.push(`Sheet "${sheetName}" tidak dikenali, dilewati.`);
      continue;
    }
    if (info.kind === 'main') {
      mainRows.set(info.staffType, rows);
    }
  }

  for (const [type, rows] of mainRows.entries()) {
    const list = type === 'guru' ? guru : tendik;
    for (let i = 6; i < rows.length; i++) {
      const r = rows[i];
      const name = clean(r[1]);
      if (!name) continue;

      const status = clean(r[3]);
      const combinedNip = cleanId(r[2]);
      const isPppk = /PPPK/i.test(status);
      const birth = splitBirth(r[5]);

      list.push({
        name,
        nip: combinedNip && !isPppk ? combinedNip : null,
        nipppk: combinedNip && isPppk ? combinedNip : null,
        nuptk: cleanId(r[4]) || null,
        status_kepegawaian: status,
        gender: normalizeGender(r[6]),
        religion: clean(r[7]),
        pangkat_golongan: clean(r[8]),
        jabatan: clean(r[9]),
        tmt_golongan: normalizeDate(r[10]),
        tmt_cpns: normalizeDate(r[11]),
        tmt_pns_pppk: normalizeDate(r[12]),
        tmt_sk_sekolah: normalizeDate(r[13]),
        birth_place: birth.place,
        birth_date: birth.date,
        is_active: true,
      });
    }
  }

  for (const sheetName of wb.SheetNames) {
    const rows = sheetRows(XLSX, wb.Sheets[sheetName]);
    if (!rows || rows.length < 7) continue;
    const info = classifySheet(rows);
    if (!info || info.kind === 'main') continue;

    const targets = buildMergeTargets(info.staffType === 'guru' ? guru : tendik);
    const label = STAFF_TYPE_LABELS[info.staffType];

    for (let i = 6; i < rows.length; i++) {
      const r = rows[i];
      const name = clean(r[1]);
      if (!name) continue;
      const person = targets.get(nameKey(name));
      if (!person) {
        warnings.push(`${label}: baris ${i + 1} ("${name}") tidak ada di data utama, dilewati.`);
        continue;
      }
      mergeRow(info.kind, person, r);
    }
  }

  return { guru, tendik, warnings };
}

function mergeRow(kind: SheetKind, person: SdmPersonRow, r: unknown[]): void {
  switch (kind) {
    case 'kgb': {
      const gaji = clean(r[4]);
      const hasKgb = clean(r[2]) !== '' && gaji !== '';
      if (hasKgb && !person.kgb) {
        person.kgb = {
          no_sk: clean(r[2]),
          tanggal_sk: normalizeDate(r[3]),
          gaji_pokok: gaji,
          mkg: clean(r[5]),
          tmt_kgb_akhir: normalizeDate(r[6]),
          tmt_kgb_berikutnya: normalizeDate(r[7]),
        };
      }
      const jenjang = clean(r[8]);
      if (jenjang) {
        person.educations = person.educations ?? [];
        person.educations.push({
          jenjang,
          jurusan: clean(r[9]),
          perguruan_tinggi: clean(r[10]),
          tahun_lulus: parseIntClean(r[11]),
          tempat: clean(r[12]),
          nomor_ijazah: clean(r[13]),
          tanggal_ijazah: normalizeDate(r[14]),
        });
      }
      break;
    }
    case 'assignment': {
      person.assignments = person.assignments ?? [];
      const tambahan = clean(r[2]);
      if (tambahan) {
        person.assignments.push({ jenis: 'tugas_tambahan', uraian: tambahan, jumlah_jam: '' });
      }
      const mengajar = clean(r[3]);
      if (mengajar) {
        person.assignments.push({ jenis: 'tugas_mengajar', uraian: mengajar, jumlah_jam: clean(r[4]) });
      }
      break;
    }
    case 'certification': {
      const noSertifikat = clean(r[3]);
      if (!noSertifikat) break;
      person.certifications = person.certifications ?? [];
      person.certifications.push({
        status: clean(r[2]),
        no_sertifikat: noSertifikat,
        no_peserta: clean(r[4]),
        no_nrg: clean(r[5]),
        bidang_studi: clean(r[6]),
        penyelenggara: clean(r[7]),
        tahun_lulus: parseIntClean(r[8]),
      });
      break;
    }
    case 'contact': {
      person.nik = cleanId(r[2]) || null;
      person.address = clean(r[3]);
      person.phone = clean(r[4]);
      person.npwp = clean(r[5]);
      person.akta_lahir = clean(r[6]);
      person.bpjs = clean(r[7]);
      person.email = clean(r[8]);
      break;
    }
    case 'sk': {
      const categories: { key: string; base: number }[] = [
        { key: 'awal_sekolah', base: 2 },
        { key: 'akhir_sekolah', base: 5 },
        { key: 'awal_dindikbud', base: 8 },
        { key: 'akhir_dindikbud', base: 11 },
      ];
      person.sk_pengangkatans = person.sk_pengangkatans ?? [];
      for (const { key, base } of categories) {
        const nomor = clean(r[base]);
        if (!nomor) continue;
        person.sk_pengangkatans.push({
          kategori: key,
          nomor_sk: nomor,
          tanggal_sk: normalizeDate(r[base + 1]),
          pejabat: clean(r[base + 2]),
        });
      }
      break;
    }
    default:
      break;
  }
}