import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';
import { accountsApi, type AccountRole } from '../../lib/api';

interface AccountRowInput {
  role: string;
  name: string;
  email: string;
  password: string;
  nisn: string;
  class: string;
  major: string;
  nip: string;
  nuptk: string;
  subject: string;
  position: string;
  division: string;
  status: string;
  must_change_password: string;
  achievements: string;
  certifications: string;
  work_programs: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

const FIELDS: { key: keyof AccountRowInput; label: string; example: string }[] = [
  { key: 'role', label: 'Role', example: 'Guru / Siswa / OSIS / Admin' },
  { key: 'name', label: 'Nama', example: 'Nama Lengkap' },
  { key: 'email', label: 'Email', example: 'nama@smkn11.sch.id' },
  { key: 'password', label: 'Password/PIN', example: '123456 (staff) atau 1234 (siswa)' },
  { key: 'nisn', label: 'NISN', example: '0061234567' },
  { key: 'class', label: 'Kelas', example: 'XII TJKT 1' },
  { key: 'major', label: 'Jurusan', example: 'Teknik Komputer dan Jaringan' },
  { key: 'nip', label: 'NIP', example: '197001012000121001' },
  { key: 'nuptk', label: 'NUPTK', example: '1234567890123456' },
  { key: 'subject', label: 'Mapel', example: 'Matematika' },
  { key: 'position', label: 'Jabatan', example: 'Wali Kelas' },
  { key: 'division', label: 'Divisi', example: 'Divisi Kreativitas' },
  { key: 'status', label: 'Status', example: 'Aktif / Nonaktif' },
  { key: 'must_change_password', label: 'Wajib Ganti Password', example: 'Tidak' },
  { key: 'achievements', label: 'Prestasi', example: 'Juara 1 LKS (pisahkan dengan ;)' },
  { key: 'certifications', label: 'Sertifikasi', example: 'Sertifikasi Profesi (;) guru' },
  { key: 'work_programs', label: 'Program Kerja', example: 'Program A (;) OSIS' },
];

function normalizeRole(raw: string): AccountRole | null {
  const r = String(raw ?? '').trim().toLowerCase();
  if (r === 'guru') return 'guru';
  if (r === 'siswa' || r === 'student') return 'student';
  if (r === 'osis') return 'osis';
  if (r === 'admin') return 'admin';
  return null;
}

function toStatus(raw: string): 'active' | 'inactive' {
  const r = String(raw ?? '').trim().toLowerCase();
  return r === 'inactive' || r === 'nonaktif' || r === 'tidak' || r === '0' ? 'inactive' : 'active';
}

function toBoolean(raw: string): boolean {
  const r = String(raw ?? '').trim().toLowerCase();
  return r === 'ya' || r === 'y' || r === 'true' || r === '1' || r === 'wajib';
}

function splitList(raw: string): string[] {
  return String(raw ?? '')
    .split(/[;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildPayload(row: AccountRowInput): { payload?: Record<string, unknown>; error?: string } {
  const name = String(row.name ?? '').trim();
  if (name.length < 2) return { error: 'Nama wajib diisi.' };

  const role = normalizeRole(String(row.role ?? ''));
  if (!role) return { error: 'Role tidak valid. Gunakan Admin, Guru, OSIS, atau Siswa.' };

  const password = String(row.password ?? '').trim();
  const status = toStatus(row.status);
  const mustChange = toBoolean(row.must_change_password);
  const base = { role, name, status, must_change_password: mustChange };

  if (role === 'student') {
    const nisn = String(row.nisn ?? '').trim();
    if (nisn.length < 4) return { error: 'NISN tidak valid (minimal 4 karakter).' };
    if (password.length < 4) return { error: 'PIN minimal 4 karakter.' };
    return {
      payload: {
        ...base,
        nisn,
        pin: password,
        class: String(row.class ?? '').trim(),
        major: String(row.major ?? '').trim(),
        achievements: splitList(row.achievements),
      },
    };
  }

  const email = String(row.email ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Email tidak valid.' };
  if (password.length < 6) return { error: 'Password minimal 6 karakter.' };

  if (role === 'guru') {
    return {
      payload: {
        ...base,
        email,
        password,
        nip: String(row.nip ?? '').trim(),
        nuptk: String(row.nuptk ?? '').trim(),
        subject: String(row.subject ?? '').trim(),
        position: String(row.position ?? '').trim(),
        achievements: splitList(row.achievements),
        certifications: splitList(row.certifications),
      },
    };
  }

  if (role === 'osis') {
    return {
      payload: {
        ...base,
        email,
        password,
        nisn: String(row.nisn ?? '').trim(),
        division: String(row.division ?? '').trim(),
        position: String(row.position ?? '').trim(),
        achievements: splitList(row.achievements),
        work_programs: splitList(row.work_programs),
      },
    };
  }

  return { payload: { ...base, email, password } };
}

export default function AccountImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [spreadsheet, setSpreadsheet] = useState<File | null>(null);
  const [rows, setRows] = useState<AccountRowInput[] | null>(null);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);

  const parseFile = async (file: File) => {
    setSpreadsheet(file);
    setError('');
    setResult(null);
    setRows(null);
    try {
      const XLSX = await import('xlsx');
      let raw: Record<string, unknown>[];
      if (file.name.toLowerCase().endsWith('.csv')) {
        const wb = XLSX.read(await file.text(), { type: 'string', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
      } else {
        const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
      }
      const mapped = raw
        .map((row) => {
          const out = {} as AccountRowInput;
          for (const [header, value] of Object.entries(row)) {
            const norm = header.trim().toLowerCase();
            const field = FIELDS.find((f) => f.label.toLowerCase() === norm || f.key.toLowerCase() === norm);
            if (field) out[field.key] = String(value ?? '').trim();
          }
          return out;
        })
        .filter((row) => Object.values(row).some((v) => v !== ''));
      setRows(mapped);
      if (mapped.length === 0) {
        setError('File tidak berisi data yang cocok. Pastikan kolomnya mengikuti template.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membaca file.');
    }
  };

  const downloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const headers = FIELDS.map((field) => field.label);
    const example = FIELDS.map((field) => field.example);
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Akun');
    XLSX.writeFile(wb, 'template-import-akun.xlsx');
  };

  const runImport = async () => {
    if (!rows || rows.length === 0) return;
    setImporting(true);
    setProgress('');
    setResult(null);
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const label = String(row.name ?? '').trim() || `Baris ${i + 2}`;
      setProgress(`Membuat akun ${i + 1}/${rows.length}...`);
      const built = buildPayload(row);
      if (built.error || !built.payload) {
        skipped += 1;
        errors.push(`${label}: ${built.error ?? 'Data tidak lengkap.'}`);
        continue;
      }
      const { error: createError } = await accountsApi.create(built.payload);
      if (createError) {
        skipped += 1;
        errors.push(`${label}: ${createError.message}`);
      } else {
        imported += 1;
      }
    }

    setResult({ imported, skipped, errors });
    setImporting(false);
    onImported();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-[#1B2A4A]/10 p-6">
          <div>
            <h2 className="text-xl font-bold text-[#1B2A4A]">Import Akun</h2>
            <p className="mt-1 text-sm text-[#5B7088]">Buat akun admin, guru, OSIS, dan siswa secara massal dari file Excel (.xlsx) atau CSV.</p>
          </div>
          <button onClick={onClose} aria-label="Tutup"><X /></button>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#FAF6F0] p-4">
            <div>
              <p className="font-semibold text-[#1B2A4A]">1. Unduh template</p>
              <p className="text-sm text-[#5B7088]">Kolom Role, Nama, dan Password/PIN wajib. Kolom lain tergantung role (lihat template).</p>
            </div>
            <button onClick={downloadTemplate} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-4 py-2 text-sm font-bold text-white">
              <Download size={16} /> Unduh Template
            </button>
          </div>

          <div>
            <p className="font-semibold text-[#1B2A4A]">2. Pilih file Excel/CSV</p>
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#1B2A4A]/20 bg-[#FAF6F0] p-6 text-center transition-colors hover:border-[#C8A951]">
              <FileSpreadsheet className="h-8 w-8 text-[#866D2C]" />
              <span className="mt-2 text-sm font-semibold text-[#1B2A4A]">{spreadsheet ? spreadsheet.name : 'Klik untuk memilih file'}</span>
              <span className="text-xs text-[#5B7088]">Format .xlsx atau .csv</span>
              <input
                type="file"
                accept=".xlsx,.csv"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) parseFile(file);
                }}
              />
            </label>
          </div>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          {rows && rows.length > 0 && (
            <div>
              <p className="font-semibold text-[#1B2A4A]">3. Preview ({rows.length} baris)</p>
              <div className="mt-2 overflow-x-auto rounded-lg border border-[#1B2A4A]/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#FAF6F0] text-[#1B2A4A]">
                    <tr>
                      {FIELDS.map((field) => (
                        <th key={field.key} className="p-3">{field.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 6).map((row, idx) => (
                      <tr key={idx} className="border-t border-[#1B2A4A]/10">
                        {FIELDS.map((field) => (
                          <td key={field.key} className="max-w-xs truncate p-3">{String(row[field.key] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 6 && <p className="mt-1 text-xs text-[#5B7088]">...dan {rows.length - 6} baris lainnya</p>}
            </div>
          )}

          {result && (
            <div className="rounded-lg bg-[#FAF6F0] p-4 text-sm">
              <p className="font-semibold text-[#1B2A4A]">Hasil import:</p>
              <p className="mt-1 flex items-center gap-1.5 font-medium text-green-700">
                <CheckCircle2 size={16} /> {result.imported} akun berhasil dibuat.
              </p>
              {result.skipped > 0 && (
                <p className="mt-1 flex items-center gap-1.5 font-medium text-amber-700">
                  <AlertTriangle size={16} /> {result.skipped} akun gagal / dilewati.
                </p>
              )}
              {result.errors.length > 0 && (
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg bg-white p-3 text-red-700">
                  {result.errors.slice(0, 20).map((message, i) => (
                    <li key={i}>• {message}</li>
                  ))}
                  {result.errors.length > 20 && <li>...dan {result.errors.length - 20} lainnya</li>}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-[#1B2A4A]/10 pt-4">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-[#5B7088]">Tutup</button>
            <button
              onClick={runImport}
              disabled={!rows || rows.length === 0 || importing}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2 font-bold text-white disabled:opacity-50"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload size={16} />}
              {importing ? progress || 'Mengimport...' : 'Import Akun'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
