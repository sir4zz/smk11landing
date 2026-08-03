import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';
import { insforge } from '../../lib/api';

interface FieldConfig {
  key: string;
  label: string;
  type?: string;
  multiline?: boolean;
}

interface ImportModalProps {
  config: { title: string; fields: FieldConfig[] };
  table: string;
  onClose: () => void;
  onImported: () => void;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function coerceValue(field: FieldConfig, value: unknown): unknown {
  if (value === null || value === undefined) return '';
  if (field.type === 'date') {
    if (value instanceof Date) return fmtDate(value);
    const s = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    if (!isNaN(d.getTime())) return fmtDate(d);
    return s;
  }
  if (field.type === 'number') {
    const n = Number(value);
    return isNaN(n) ? String(value).trim() : n;
  }
  return String(value).trim();
}

function slugify(text: unknown) {
  return String(text ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function isUrl(value: string) {
  return /^https?:\/\//i.test(value) || value.startsWith('data:image/');
}

function exampleValue(key: string) {
  switch (key) {
    case 'photo': return 'URL foto ATAU nama file foto yang diupload';
    case 'date': return '2026-01-15';
    case 'year': return '2026';
    case 'name': return 'Nama Lengkap';
    case 'title': return 'Judul';
    case 'position': return 'Jabatan';
    case 'department': return 'Unit / Departemen';
    case 'category': return 'Kategori';
    case 'author': return 'Penulis';
    case 'description':
    case 'excerpt':
    case 'shortDescription': return 'Deskripsi singkat';
    default: return '';
  }
}

export default function ImportModal({ config, table, onClose, onImported }: ImportModalProps) {
  const [spreadsheet, setSpreadsheet] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);

  const hasPhotoField = config.fields.some((field) => field.key === 'photo');
  const primaryField = config.fields.some((field) => field.key === 'name') ? 'name' : 'title';
  const needsSlug = table === 'news' || table === 'programs';

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
          const out: Record<string, unknown> = {};
          for (const [header, value] of Object.entries(row)) {
            const norm = header.trim().toLowerCase();
            const field = config.fields.find(
              (f) => f.label.toLowerCase() === norm || f.key.toLowerCase() === norm
            );
            if (field) out[field.key] = coerceValue(field, value);
          }
          return out;
        })
        .filter((row) => Object.keys(row).length > 0);
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
    const headers = config.fields.map((field) => field.label);
    const example = config.fields.map((field) => exampleValue(field.key));
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `template-${config.title.toLowerCase().replace(/\s+/g, '-')}.xlsx`);
  };

  const resolvePhoto = async (value: unknown, photoMap: Map<string, File>): Promise<string> => {
    const raw = String(value ?? '').trim();
    if (!raw || isUrl(raw)) return raw;
    const base = raw.split(/[\\/]/).pop() || raw;
    const file = photoMap.get(base.toLowerCase());
    if (!file) return raw;
    const { data, error } = await insforge.storage.from('photos').uploadAuto(file);
    if (error || !data) return raw;
    return data.url;
  };

  const runImport = async () => {
    if (!rows || rows.length === 0) return;
    setImporting(true);
    setProgress('');
    setResult(null);
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    const photoMap = new Map<string, File>();
    photoFiles.forEach((file) => photoMap.set(file.name.toLowerCase(), file));

    const { error: authError } = await insforge.auth.getCurrentUser();
    if (authError) {
      setResult({ imported: 0, skipped: rows.length, errors: ['Sesi admin tidak valid. Silakan login ulang.'] });
      setImporting(false);
      return;
    }

    const usedSlugs = new Set<string>();
    if (needsSlug) {
      const { data } = await insforge.database.from(table).select('slug');
      ((data as { slug?: string }[]) || []).forEach((item) => {
        if (item.slug) usedSlugs.add(item.slug);
      });
    }

    const prepared: Record<string, unknown>[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = { ...rows[i] };
      const primaryValue = String(row[primaryField] ?? '').trim();
      if (!primaryValue) {
        skipped += 1;
        errors.push(`Baris ${i + 2}: kolom ${primaryField} kosong.`);
        continue;
      }
      if (needsSlug) {
        const base = slugify(row.slug ?? row[primaryField]);
        let slug = base;
        let n = 2;
        while (usedSlugs.has(slug)) {
          slug = `${base}-${n}`;
          n += 1;
        }
        usedSlugs.add(slug);
        row.slug = slug;
      }
      if (hasPhotoField) {
        setProgress(`Menyiapkan foto ${i + 1}/${rows.length}...`);
        row.photo = await resolvePhoto(row.photo, photoMap);
      }
      prepared.push(row);
    }

    const chunkSize = 100;
    for (let i = 0; i < prepared.length; i += chunkSize) {
      const batch = prepared.slice(i, i + chunkSize);
      setProgress(`Menyimpan data ${Math.min(i + chunkSize, prepared.length)}/${prepared.length}...`);
      const { error: batchError } = await insforge.database.from(table).insert(batch);
      if (batchError) {
        for (const row of batch) {
          const { error: rowError } = await insforge.database.from(table).insert([row]);
          if (rowError) {
            errors.push(`${String(row[primaryField] ?? '?')}: ${rowError.message}`);
            skipped += 1;
          } else {
            imported += 1;
          }
        }
      } else {
        imported += batch.length;
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
            <h2 className="text-xl font-bold text-[#1B2A4A]">Import {config.title}</h2>
            <p className="mt-1 text-sm text-[#5B7088]">Impor data massal dari file Excel (.xlsx) atau CSV.</p>
          </div>
          <button onClick={onClose} aria-label="Tutup"><X /></button>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#FAF6F0] p-4">
            <div>
              <p className="font-semibold text-[#1B2A4A]">1. Unduh template</p>
              <p className="text-sm text-[#5B7088]">Gunakan template agar kolom sudah sesuai.</p>
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

          {hasPhotoField && (
            <div>
              <p className="font-semibold text-[#1B2A4A]">3. Upload foto (opsional)</p>
              <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#1B2A4A]/20 bg-[#FAF6F0] p-6 text-center transition-colors hover:border-[#C8A951]">
                <Upload className="h-8 w-8 text-[#866D2C]" />
                <span className="mt-2 text-sm font-semibold text-[#1B2A4A]">
                  {photoFiles.length ? `${photoFiles.length} file foto dipilih` : 'Klik untuk memilih file foto'}
                </span>
                <span className="mt-1 text-xs text-[#5B7088]">
                  Boleh pilih banyak file sekaligus. Jika kolom Foto berisi nama file, otomatis dicocokkan. Jika berisi URL, langsung dipakai.
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => setPhotoFiles(Array.from(event.target.files || []))}
                />
              </label>
            </div>
          )}

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          {rows && rows.length > 0 && (
            <div>
              <p className="font-semibold text-[#1B2A4A]">4. Preview ({rows.length} baris)</p>
              <div className="mt-2 overflow-x-auto rounded-lg border border-[#1B2A4A]/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#FAF6F0] text-[#1B2A4A]">
                    <tr>
                      {config.fields.map((field) => (
                        <th key={field.key} className="p-3">{field.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 6).map((row, idx) => (
                      <tr key={idx} className="border-t border-[#1B2A4A]/10">
                        {config.fields.map((field) => (
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
                <CheckCircle2 size={16} /> {result.imported} data berhasil diimport.
              </p>
              {result.skipped > 0 && (
                <p className="mt-1 flex items-center gap-1.5 font-medium text-amber-700">
                  <AlertTriangle size={16} /> {result.skipped} data gagal / dilewati.
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
              {importing ? progress || 'Mengimport...' : 'Import Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
