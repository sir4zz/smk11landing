import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';
import { backendApi } from '../../lib/api';

interface StudentRowInput {
  nisn: string;
  name: string;
  class: string;
  major: string;
  gender: string;
  date_of_birth: string;
  place_of_birth: string;
  address: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; nisn?: string; message: string }[];
}

const FIELDS: { key: keyof StudentRowInput; label: string; example: string }[] = [
  { key: 'nisn', label: 'NISN', example: '0061234567' },
  { key: 'name', label: 'Nama', example: 'Nama Lengkap' },
  { key: 'class', label: 'Kelas', example: 'X TJKT 1' },
  { key: 'major', label: 'Jurusan', example: 'Teknik Komputer dan Jaringan' },
  { key: 'gender', label: 'Jenis Kelamin', example: 'L / P' },
  { key: 'date_of_birth', label: 'Tanggal Lahir', example: '12/05/2008' },
  { key: 'place_of_birth', label: 'Tempat Lahir', example: 'Bandung' },
  { key: 'address', label: 'Alamat', example: 'Jl. Merdeka No. 12' },
];

function normalizeGender(raw: unknown): string {
  const r = String(raw ?? '').trim().toLowerCase();
  if (r === 'l' || r === 'm' || r === 'pria' || r === 'laki' || r === 'laki-laki' || r === 'male') return 'L';
  if (r === 'p' || r === 'f' || r === 'wanita' || r === 'perempuan' || r === 'female') return 'P';
  return '';
}

function toDateString(value: unknown): string {
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

export default function StudentImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [spreadsheet, setSpreadsheet] = useState<File | null>(null);
  const [rows, setRows] = useState<StudentRowInput[] | null>(null);
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
      let wb: Awaited<ReturnType<typeof XLSX.read>>;
      if (file.name.toLowerCase().endsWith('.csv')) {
        wb = XLSX.read(await file.text(), { type: 'string', cellDates: true });
      } else {
        wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
      }
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

      const mapped = raw
        .map((row) => {
          const out = {} as StudentRowInput;
          for (const [header, value] of Object.entries(row)) {
            const norm = header.trim().toLowerCase();
            const field = FIELDS.find((f) => f.label.toLowerCase() === norm || f.key.toLowerCase() === norm);
            if (!field) continue;
            if (field.key === 'gender') out.gender = normalizeGender(value);
            else if (field.key === 'date_of_birth') out.date_of_birth = toDateString(value);
            else out[field.key] = String(value ?? '').trim();
          }
          return { ...out, nisn: String(out.nisn ?? '').trim() };
        })
        .filter((row) => Object.values(row).some((v) => v !== ''));

      if (mapped.length === 0) {
        setError('File tidak berisi data yang cocok. Pastikan kolomnya mengikuti template.');
      }
      setRows(mapped);
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
    XLSX.utils.book_append_sheet(wb, ws, 'Siswa');
    XLSX.writeFile(wb, 'template-import-siswa.xlsx');
  };

  const runImport = async () => {
    if (!rows || rows.length === 0) return;
    setImporting(true);
    setProgress('');
    setResult(null);

    const { data, error: apiError } = await backendApi.database.rpc('admin_import_students', { rows });

    if (apiError) {
      setResult({ imported: 0, skipped: rows.length, errors: [{ row: 2, message: apiError.message ?? 'Gagal mengimport siswa.' }] });
    } else if (data) {
      setResult(data);
    } else {
      setResult({ imported: 0, skipped: rows.length, errors: [{ row: 2, message: 'Gagal mengimport siswa.' }] });
    }

    setImporting(false);
    onImported();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-[#1B2A4A]/10 p-6">
          <div>
            <h2 className="text-xl font-bold text-[#1B2A4A]">Import Siswa</h2>
            <p className="mt-1 text-sm text-[#5B7088]">Import data siswa sekaligus akun login (NISN + PIN) dari file Excel (.xlsx) atau CSV.</p>
          </div>
          <button onClick={onClose} aria-label="Tutup"><X /></button>
        </div>

        <div className="space-y-6 p-6">
          <div className="rounded-xl bg-[#FAF6F0] p-4 text-sm text-[#5B7088]">
            <p className="font-semibold text-[#1B2A4A]">Ketentuan</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              <li>Kolom <strong>NISN</strong> dan <strong>Nama</strong> wajib diisi. Pastikan kolom NISN berformat teks agar angka nol di depan tidak hilang.</li>
              <li><strong>Jenis Kelamin</strong> diisi <code>L</code> atau <code>P</code> (Laki-laki/Perempuan diterima juga).</li>
              <li><strong>Tanggal Lahir</strong> menerima format <code>DD/MM/YYYY</code>, <code>YYYY-MM-DD</code>, atau serial Excel.</li>
              <li><strong>Jurusan</strong> diisi nama jurusan langsung, contoh: Teknik Komputer dan Jaringan.</li>
              <li>PIN login siswa dibuat otomatis (4 digit terakhir NISN). Baris dengan NISN duplikat akan dilewati.</li>
            </ul>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#FAF6F0] p-4">
            <div>
              <p className="font-semibold text-[#1B2A4A]">1. Unduh template</p>
              <p className="text-sm text-[#5B7088]">Format kolom mengikuti template di bawah.</p>
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
                <CheckCircle2 size={16} /> {result.imported} siswa berhasil diimport.
              </p>
              {result.skipped > 0 && (
                <p className="mt-1 flex items-center gap-1.5 font-medium text-amber-700">
                  <AlertTriangle size={16} /> {result.skipped} baris gagal / dilewati.
                </p>
              )}
              {result.errors.length > 0 && (
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg bg-white p-3 text-red-700">
                  {result.errors.slice(0, 20).map((err, i) => (
                    <li key={i}>• Baris {err.row}{err.nisn ? ` (NISN ${err.nisn})` : ''}: {err.message}</li>
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
              {importing ? progress || 'Mengimport...' : 'Import Siswa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}