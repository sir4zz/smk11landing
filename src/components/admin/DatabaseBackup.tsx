import { useCallback, useEffect, useRef, useState } from 'react';
import { DatabaseBackup as DatabaseBackupIcon, Download, Loader2, RefreshCw, Trash2, Upload, RotateCcw, AlertTriangle } from 'lucide-react';
import { backupApi, downloadBackup, restoreChunked, type BackupFileRow } from '../../lib/api';

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toLocaleString('id-ID', { maximumFractionDigits: index === 0 ? 0 : 1 })} ${units[index]}`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function DatabaseBackup() {
  const [rows, setRows] = useState<BackupFileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [tab, setTab] = useState<'backup' | 'restore'>('backup');
  const [restoring, setRestoring] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await backupApi.list();
    if (!error && data) {
      setRows(data);
    } else {
      setMsg({ type: 'err', text: (error as { message?: string })?.message ?? 'Gagal memuat daftar backup.' });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    setCreating(true);
    setMsg(null);
    const { data, error } = await backupApi.create();
    if (!error && data) {
      setMsg({ type: 'ok', text: `Backup berhasil dibuat: ${data.name}` });
      await load();
    } else {
      setMsg({ type: 'err', text: (error as { message?: string })?.message ?? 'Gagal membuat backup.' });
    }
    setCreating(false);
  };

  const remove = async (name: string) => {
    if (!confirm(`Hapus file backup ${name}?`)) return;
    setDeleting(name);
    setMsg(null);
    const { error } = await backupApi.remove(name);
    if (!error) {
      await load();
    } else {
      setMsg({ type: 'err', text: (error as { message?: string })?.message ?? 'Gagal menghapus backup.' });
    }
    setDeleting(null);
  };

  const handleDownload = async (name: string) => {
    try {
      await downloadBackup(name);
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Gagal mengunduh backup.' });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.zip')) {
        setMsg({ type: 'err', text: 'Hanya file .zip yang diperbolehkan.' });
        return;
      }
      setRestoreFile(file);
      setMsg(null);
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) return;
    setRestoring(true);
    setMsg(null);
    setShowRestoreConfirm(false);
    setUploadProgress({ current: 0, total: 0 });

    const { data, error } = await restoreChunked(restoreFile, (current, total) => {
      setUploadProgress({ current, total });
    });

    if (!error && data) {
      setMsg({ type: 'ok', text: `Restore berhasil! ${data.tables_restored} tabel dipulihkan.${data.media_restored ? ' File media juga dipulihkan.' : ''}` });
      setRestoreFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      setMsg({ type: 'err', text: (error as { message?: string })?.message ?? 'Gagal melakukan restore.' });
    }
    setRestoring(false);
    setUploadProgress(null);
  };

  return (
    <div className="space-y-6">
      {/* Header + Tab Switcher */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#FAF6F0]">
              <DatabaseBackupIcon className="text-[#866D2C]" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1B2A4A]">Backup &amp; Restore</h2>
              <p className="mt-1 max-w-xl text-sm text-[#5B7088]">
                Buat salinan seluruh konten website (data + media) atau pulihkan dari file backup.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="mt-4 flex gap-2 border-b border-[#1B2A4A]/10 pb-0">
          <button
            onClick={() => { setTab('backup'); setMsg(null); }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === 'backup'
                ? 'border-[#C8A951] text-[#1B2A4A]'
                : 'border-transparent text-[#5B7088] hover:text-[#1B2A4A]'
            }`}
          >
            <DatabaseBackupIcon size={16} /> Backup
          </button>
          <button
            onClick={() => { setTab('restore'); setMsg(null); }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === 'restore'
                ? 'border-[#C8A951] text-[#1B2A4A]'
                : 'border-transparent text-[#5B7088] hover:text-[#1B2A4A]'
            }`}
          >
            <RotateCcw size={16} /> Restore
          </button>
        </div>

        {msg && (
          <p className={`mt-4 rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg.text}
          </p>
        )}
      </div>

      {/* Backup Tab */}
      {tab === 'backup' && (
        <>
          {/* Create Backup Card */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold text-[#1B2A4A]">Buat Backup Baru</h3>
                <p className="mt-1 max-w-xl text-sm text-[#5B7088]">
                  Backup mencakup seluruh konten website: berita, program, fasilitas, staf, galeri, OSIS, ekstrakurikuler, kesemaptaan, mading, SPMB, BKK, kelulusan, SDM, dan file media (foto, gambar galeri, poster SPMB). <span className="font-semibold">Tidak termasuk</span> akun user, role, dan permission. Format: <code className="rounded bg-[#FAF6F0] px-1.5 py-0.5 text-xs">.zip</code>
                </p>
              </div>
              <button
                onClick={create}
                disabled={creating}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 font-bold text-[#1B2A4A] transition-colors hover:bg-[#B69740] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseBackupIcon size={18} />}
                {creating ? 'Membuat...' : 'Buat Backup Sekarang'}
              </button>
            </div>
          </div>

          {/* Backup List */}
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#1B2A4A]/10 px-5 py-4">
              <h3 className="font-bold text-[#1B2A4A]">Daftar Backup</h3>
              <button
                onClick={() => void load()}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#866D2C] hover:text-[#B69740]"
              >
                <RefreshCw size={15} /> Muat Ulang
              </button>
            </div>

            {loading ? (
              <div className="grid min-h-[160px] place-items-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#866D2C]" />
              </div>
            ) : rows.length === 0 ? (
              <div className="p-8 text-center text-[#5B7088]">
                <DatabaseBackupIcon className="mx-auto mb-3 text-[#866D2C]" size={36} />
                <p>Belum ada backup. Klik &ldquo;Buat Backup Sekarang&rdquo; untuk memulai.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FAF6F0] text-[#1B2A4A]">
                  <tr>
                    <th className="p-4">Nama File</th>
                    <th className="p-4">Ukuran</th>
                    <th className="p-4">Dibuat</th>
                    <th className="p-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.name} className="border-t border-[#1B2A4A]/10">
                      <td className="p-4 font-mono text-xs text-[#23314D]">{row.name}</td>
                      <td className="p-4 whitespace-nowrap text-[#5B7088]">{formatBytes(row.size)}</td>
                      <td className="p-4 whitespace-nowrap text-[#5B7088]">{formatDate(row.created_at)}</td>
                      <td className="p-4 whitespace-nowrap">
                        <button
                          onClick={() => void handleDownload(row.name)}
                          className="mr-3 inline-flex items-center gap-1 text-[#866D2C] hover:text-[#B69740]"
                          title="Unduh"
                        >
                          <Download size={17} /> Unduh
                        </button>
                        <button
                          onClick={() => void remove(row.name)}
                          disabled={deleting === row.name}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                          title="Hapus"
                        >
                          {deleting === row.name ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={17} />} Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Restore Tab */}
      {tab === 'restore' && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-50">
              <RotateCcw className="text-orange-600" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[#1B2A4A]">Restore dari Backup</h3>
              <p className="mt-1 max-w-xl text-sm text-[#5B7088]">
                Unggah file backup <code className="rounded bg-[#FAF6F0] px-1.5 py-0.5 text-xs">.zip</code> untuk memulihkan konten website (data + media). Tidak mempengaruhi akun user, role, dan permission.
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={18} />
            <div className="text-sm text-amber-800">
              <p className="font-semibold">Peringatan: Proses ini akan menimpa data konten yang ada.</p>
              <p className="mt-1">Seluruh tabel konten akan di-drop dan dibuat ulang dari file backup. File media (foto, gambar galeri) juga akan ditimpa. Akun user, role, dan permission tidak terpengaruh.</p>
            </div>
          </div>

          {/* File Input */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-[#1B2A4A]">Pilih File Backup (.zip)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileSelect}
              disabled={restoring}
              className="mt-2 block w-full rounded-lg border border-[#1B2A4A]/20 bg-white px-4 py-2.5 text-sm text-[#1B2A4A] file:mr-3 file:rounded-md file:border-0 file:bg-[#C8A951] file:px-4 file:py-1.5 file:text-sm file:font-bold file:text-[#1B2A4A] hover:file:bg-[#B69740] disabled:opacity-60"
            />
            {restoreFile && (
              <p className="mt-2 text-sm text-[#5B7088]">
                Dipilih: <span className="font-semibold text-[#1B2A4A]">{restoreFile.name}</span> ({formatBytes(restoreFile.size)})
              </p>
            )}
          </div>

          {/* Restore Button */}
          <div className="mt-4 flex justify-end">
            {restoring && uploadProgress && (
              <div className="mr-auto flex items-center gap-3 text-sm text-[#5B7088]">
                <Loader2 className="h-4 w-4 animate-spin text-[#866D2C]" />
                <span>
                  Mengunggah chunk {uploadProgress.current}/{uploadProgress.total}...
                </span>
                <div className="h-2 w-32 overflow-hidden rounded-full bg-[#1B2A4A]/10">
                  <div
                    className="h-full rounded-full bg-[#C8A951] transition-all duration-300"
                    style={{ width: `${uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
            <button
              onClick={() => setShowRestoreConfirm(true)}
              disabled={!restoreFile || restoring}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-6 py-2.5 font-bold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {restoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw size={18} />}
              {restoring ? 'Memulihkan...' : 'Restore Sekarang'}
            </button>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-100">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <h3 className="text-lg font-bold text-[#1B2A4A]">Konfirmasi Restore</h3>
            </div>
            <p className="mt-4 text-sm text-[#5B7088]">
              Anda akan memulihkan konten dari file <span className="font-semibold text-[#1B2A4A]">{restoreFile?.name}</span>.
              Semua data konten dan file media saat ini <span className="font-bold text-red-600">akan ditimpa</span>.
              Akun user, role, dan permission tidak terpengaruh.
            </p>
            <p className="mt-2 text-sm font-semibold text-red-600">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowRestoreConfirm(false)}
                disabled={restoring}
                className="rounded-lg border border-[#1B2A4A]/20 px-4 py-2 text-sm font-semibold text-[#1B2A4A] hover:bg-[#FAF6F0]"
              >
                Batal
              </button>
              <button
                onClick={handleRestore}
                disabled={restoring}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {restoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw size={16} />}
                {restoring ? 'Memulihkan...' : 'Ya, Restore!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
