import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';
import { accountsApi } from '../../lib/api';
import { TEMPLATE_COLUMNS, TEMPLATE_HEADER_ROWS, normalizeClass, normalizeGender, toDateString } from '../../lib/studentBiodata';

interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; nisn?: string; message: string }[];
}

// Kolom yang ditampilkan pada preview.
const PREVIEW_KEYS: { key: string; label: string }[] = [
  { key: 'nisn', label: 'NISN' },
  { key: 'nis', label: 'NIS' },
  { key: 'name', label: 'Nama' },
  { key: 'class', label: 'Kelas' },
  { key: 'major', label: 'Jurusan' },
  { key: 'gender', label: 'Kelamin' },
  { key: 'place_of_birth', label: 'Tempat Lahir' },
  { key: 'date_of_birth', label: 'Tgl Lahir' },
  { key: 'religion', label: 'Agama' },
];

const TEMPLATE_URL = `${(import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')}/templates/template_biodata_siswa.xlsx`;

export default function StudentImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [spreadsheet, setSpreadsheet] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, string>[] | null>(null);
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
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const grid = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' });

      const mapped = grid
        .slice(TEMPLATE_HEADER_ROWS)
        .map((cells) => {
          const out: Record<string, string> = {};
          for (const [colIdx, key] of Object.entries(TEMPLATE_COLUMNS)) {
            const value = cells[Number(colIdx)];
            if (value === null || value === undefined || String(value).trim() === '') continue;
            if (key === 'gender') out.gender = normalizeGender(value);
            else if (key === 'class') out.class = normalizeClass(value);
            else if (key === 'date_of_birth' || key === 'tanggal_sttb' || key === 'tanggal_diterima' || key === 'ayah_tanggal_lahir' || key === 'ibu_tanggal_lahir' || key === 'wali_tanggal_lahir' || key === 'siswa_tanggal') {
              out[key] = toDateString(value);
            } else {
              out[key] = String(value).trim();
            }
          }
          return out;
        })
        .filter((row) => Object.values(row).some((v) => v !== ''));

      if (mapped.length === 0) {
        setError('File tidak berisi data pada kolom template. Isi mulai baris ke-9 pada template (di bawah baris contoh).');
      }
      setRows(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membaca file.');
    }
  };

  const downloadTemplate = () => {
    const a = document.createElement('a');
    a.href = TEMPLATE_URL;
    a.download = 'BIODATA PESERTA DIDIK BARU.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const runImport = async () => {
    if (!rows || rows.length === 0) return;
    setImporting(true);
    setProgress('');
    setResult(null);

    const { data, error: apiError } = await accountsApi.importStudents(rows);

    if (apiError) {
      setResult({ imported: 0, skipped: rows.length, errors: [{ row: 9, message: apiError.message ?? 'Gagal mengimport siswa.' }] });
    } else if (data) {
      setResult(data);
    } else {
      setResult({ imported: 0, skipped: rows.length, errors: [{ row: 9, message: 'Gagal mengimport siswa.' }] });
    }

    setImporting(false);
    onImported();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-[#1B2A4A]/10 p-6">
          <div>
            <h2 className="text-xl font-bold text-[#1B2A4A]">Import Siswa</h2>
            <p className="mt-1 text-sm text-[#5B7088]">Import data BIODATA siswa sekaligus akun login (NISN + PIN) dari file Excel (.xlsx).</p>
          </div>
          <button onClick={onClose} aria-label="Tutup"><X /></button>
        </div>

        <div className="space-y-6 p-6">
          <div className="rounded-xl bg-[#FAF6F0] p-4 text-sm text-[#5B7088]">
            <p className="font-semibold text-[#1B2A4A]">Ketentuan</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              <li>Gunakan <strong>template asli BIODATA PESERTA DIDIK BARU</strong> (73 kolom, 9 seksi) dari tombol Unduh Template. Template juga berisi sheet <strong>Petunjuk Penggunaan</strong>.</li>
              <li>Isi data dimulai pada <strong>baris ke-9</strong> (tepat di bawah baris contoh). Baris header 1-7 dan contoh di baris 8 otomatis dilewati.</li>
              <li>Kolom <strong>NISN</strong> dan <strong>Nama</strong> wajib diisi. Pastikan kolom NISN &amp; NIS berformat teks agar angka nol di depan tidak hilang.</li>
              <li><strong>Kelas</strong> hanya boleh <code>X</code>, <code>XI</code>, atau <code>XII</code> (tingkat kelas saja, bukan gabungan jurusan). <strong>Jurusan</strong> diisi terpisah pada kolom JURUSAN.</li>
              <li><strong>Jenis Kelamin</strong> diisi <code>L</code> atau <code>P</code> (Laki-laki/Perempuan diterima juga). <strong>Tanggal</strong> menerima format <code>DD/MM/YYYY</code>, <code>YYYY-MM-DD</code>, atau serial Excel.</li>
              <li>PIN login siswa dibuat otomatis (4 digit terakhir NISN). Baris dengan NISN/NIS duplikat atau tidak valid akan dilewati dan dicatat dalam laporan.</li>
            </ul>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#FAF6F0] p-4">
            <div>
              <p className="font-semibold text-[#1B2A4A]">1. Unduh template</p>
              <p className="text-sm text-[#5B7088]">Template asli BIODATA PESERTA DIDIK BARU (format persis, termasuk header 3 lapis).</p>
            </div>
            <button onClick={downloadTemplate} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-4 py-2 text-sm font-bold text-white">
              <Download size={16} /> Unduh Template
            </button>
          </div>

          <div>
            <p className="font-semibold text-[#1B2A4A]">2. Pilih file Excel</p>
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#1B2A4A]/20 bg-[#FAF6F0] p-6 text-center transition-colors hover:border-[#C8A951]">
              <FileSpreadsheet className="h-8 w-8 text-[#866D2C]" />
              <span className="mt-2 text-sm font-semibold text-[#1B2A4A]">{spreadsheet ? spreadsheet.name : 'Klik untuk memilih file'}</span>
              <span className="text-xs text-[#5B7088]">Format .xlsx</span>
              <input
                type="file"
                accept=".xlsx"
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
                      {PREVIEW_KEYS.map((field) => (
                        <th key={field.key} className="p-3">{field.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 6).map((row, idx) => (
                      <tr key={idx} className="border-t border-[#1B2A4A]/10">
                        {PREVIEW_KEYS.map((field) => (
                          <td key={field.key} className="max-w-xs truncate p-3">{row[field.key] ?? ''}</td>
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
