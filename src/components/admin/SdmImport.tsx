import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';
import { sdmApi } from '../../lib/api';
import type { SdmPreviewResult, SdmImportResult, SdmType } from '../../lib/api';
import { parseSdmWorkbook } from '../../lib/sdmImportParser';
import type { SdmPersonRow } from '../../lib/api';

interface SdmImportProps {
  type: SdmType;
  onClose: () => void;
  onImported: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Baru',
  update: 'Pembaruan',
  duplicate: 'Duplikat',
  problematic: 'Bermasalah',
};

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-green-50 text-green-700',
  update: 'bg-blue-50 text-blue-700',
  duplicate: 'bg-amber-50 text-amber-700',
  problematic: 'bg-red-50 text-red-700',
};

export default function SdmImport({ type, onClose, onImported }: SdmImportProps) {
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [parsed, setParsed] = useState<{ guru: SdmPersonRow[]; tendik: SdmPersonRow[] } | null>(null);
  const [preview, setPreview] = useState<SdmPreviewResult | null>(null);
  const [result, setResult] = useState<SdmImportResult | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);

  const persons = useMemo(() => (parsed ? parsed[type] : []), [parsed, type]);

  const parseFile = async (file: File) => {
    setFileName(file.name);
    setParseError('');
    setWarnings([]);
    setParsed(null);
    setPreview(null);
    setResult(null);
    try {
      const parsedWorkbook = await parseSdmWorkbook(file);
      const countGuru = parsedWorkbook.guru.length;
      const countTendik = parsedWorkbook.tendik.length;
      if (countGuru === 0 && countTendik === 0) {
        setParseError('File tidak berisi data guru / tenaga kependidikan yang dikenali.');
        return;
      }
      setParsed({ guru: parsedWorkbook.guru, tendik: parsedWorkbook.tendik });
      setWarnings(parsedWorkbook.warnings);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Gagal membaca file.');
    }
  };

  const runPreview = async () => {
    if (persons.length === 0) return;
    setPreviewing(true);
    setPreview(null);
    setResult(null);
    const { data, error } = await sdmApi.preview(type, persons);
    if (error) {
      setParseError(error.message ?? 'Gagal menganalisa data.');
    } else {
      setPreview(data);
    }
    setPreviewing(false);
  };

  const runImport = async () => {
    if (!preview) return;
    setImporting(true);
    setResult(null);
    const { data, error } = await sdmApi.import(type, persons);
    if (error) {
      setParseError(error.message ?? 'Gagal mengimport data.');
    } else {
      setResult(data);
      onImported();
    }
    setImporting(false);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-[#1B2A4A]/10 p-6">
          <div>
            <h2 className="text-xl font-bold text-[#1B2A4A]">Import Data {type === 'guru' ? 'Guru' : 'Tenaga Kependidikan'}</h2>
            <p className="mt-1 text-sm text-[#5B7088]">Upload file Excel "DATA GURU, TU" (multi-sheet) untuk digabungkan otomatis per orang.</p>
          </div>
          <button onClick={onClose} aria-label="Tutup"><X /></button>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <p className="font-semibold text-[#1B2A4A]">1. Pilih file Excel</p>
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#1B2A4A]/20 bg-[#FAF6F0] p-8 text-center transition-colors hover:border-[#C8A951]">
              <FileSpreadsheet className="h-10 w-10 text-[#866D2C]" />
              <span className="mt-3 text-sm font-semibold text-[#1B2A4A]">{fileName || 'Klik untuk memilih file'}</span>
              <span className="mt-1 text-xs text-[#5B7088]">Format .xlsx sesuai struktur Dapodik sekolah (sheet Hal.1-2 s.d. Hal.18).</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void parseFile(file);
                }}
              />
            </label>
          </div>

          {parseError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{parseError}</p>}

          {parsed && (
            <div className="rounded-lg bg-[#FAF6F0] p-4 text-sm">
              <p className="font-semibold text-[#1B2A4A]">Hasil pembacaan file:</p>
              <p className="mt-1">Ditemukan <strong>{parsed.guru.length} guru</strong> dan <strong>{parsed.tendik.length} tenaga kependidikan</strong>.</p>
              <p className="text-xs text-[#5B7088]">Data yang akan diimport sesuai tab aktif: <strong>{type === 'guru' ? 'Guru' : 'Tenaga Kependidikan'}</strong> ({persons.length} orang).</p>
              {warnings.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-semibold text-amber-700">Peringatan ({warnings.length})</summary>
                  <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto rounded-lg bg-white p-3 text-xs text-amber-800">
                    {warnings.slice(0, 30).map((w, i) => <li key={i}>• {w}</li>)}
                    {warnings.length > 30 && <li>...dan {warnings.length - 30} lainnya</li>}
                  </ul>
                </details>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={runPreview}
                  disabled={persons.length === 0 || previewing || importing}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2 font-bold text-white disabled:opacity-50"
                >
                  {previewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload size={16} />}
                  {previewing ? 'Menganalisa...' : 'Analisa Data (Preview)'}
                </button>
              </div>
            </div>
          )}

          {preview && (
            <div>
              <p className="font-semibold text-[#1B2A4A]">2. Preview ({preview.summary.total} baris)</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                <PreviewCard label="Total" value={preview.summary.total} />
                <PreviewCard label="Valid" value={preview.summary.valid} tone="green" />
                <PreviewCard label="Baru" value={preview.summary.new} />
                <PreviewCard label="Pembaruan" value={preview.summary.update} />
                <PreviewCard label="Duplikat" value={preview.summary.duplicates} tone="amber" />
                <PreviewCard label="Bermasalah" value={preview.summary.problematic} tone="red" />
              </div>

              <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-[#1B2A4A]/10">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-[#FAF6F0] text-[#1B2A4A]">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Nama</th>
                      <th className="p-3">Identitas</th>
                      <th className="p-3">Jabatan</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.items.map((item) => (
                      <tr key={item.index} className="border-t border-[#1B2A4A]/10">
                        <td className="p-3">{item.index}</td>
                        <td className="p-3 font-semibold">{item.name}</td>
                        <td className="p-3 font-mono text-xs">{item.identifier}</td>
                        <td className="p-3">{item.jabatan || '-'}</td>
                        <td className="p-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[item.status]}`}>{STATUS_LABELS[item.status]}</span>
                        </td>
                        <td className="p-3 text-xs text-[#5B7088]">{item.issues.join('; ') || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!result && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={runImport}
                    disabled={preview.summary.valid === 0 || importing}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-6 py-2 font-bold text-[#1B2A4A] disabled:opacity-50"
                  >
                    {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload size={16} />}
                    {importing ? 'Mengimport...' : `Import ${preview.summary.valid} Data`}
                  </button>
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="rounded-lg bg-[#FAF6F0] p-4 text-sm">
              <p className="font-semibold text-[#1B2A4A]">Hasil import:</p>
              <p className="mt-1 flex items-center gap-1.5 font-medium text-green-700">
                <CheckCircle2 size={16} /> {result.summary.imported} data baru berhasil disimpan.
              </p>
              {result.summary.updated > 0 && (
                <p className="mt-1 flex items-center gap-1.5 font-medium text-blue-700">
                  <CheckCircle2 size={16} /> {result.summary.updated} data diperbarui.
                </p>
              )}
              {result.summary.skipped > 0 && (
                <p className="mt-1 flex items-center gap-1.5 font-medium text-amber-700">
                  <AlertTriangle size={16} /> {result.summary.skipped} data dilewati.
                </p>
              )}
              {result.errors.length > 0 && (
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg bg-white p-3 text-red-700">
                  {result.errors.slice(0, 20).map((err, i) => (
                    <li key={i}>• Baris {err.row} ({err.name}): {err.message}</li>
                  ))}
                  {result.errors.length > 20 && <li>...dan {result.errors.length - 20} lainnya</li>}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-[#1B2A4A]/10 pt-4">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-[#5B7088]">Tutup</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewCard({ label, value, tone }: { label: string; value: number; tone?: 'green' | 'amber' | 'red' }) {
  const toneClass = tone === 'green' ? 'text-green-700' : tone === 'amber' ? 'text-amber-700' : tone === 'red' ? 'text-red-700' : 'text-[#1B2A4A]';
  return (
    <div className="rounded-lg bg-white p-3 shadow-sm">
      <p className={`text-2xl font-bold ${toneClass}`}>{value}</p>
      <p className="text-xs text-[#5B7088]">{label}</p>
    </div>
  );
}