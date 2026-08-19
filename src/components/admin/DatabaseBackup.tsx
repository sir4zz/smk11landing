import { useCallback, useEffect, useState } from 'react';
import { DatabaseBackup as DatabaseBackupIcon, Download, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { backupApi, downloadBackup, type BackupFileRow } from '../../lib/api';

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

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#FAF6F0]">
              <DatabaseBackupIcon className="text-[#866D2C]" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1B2A4A]">Backup Database</h2>
              <p className="mt-1 max-w-xl text-sm text-[#5B7088]">
                Buat salinan seluruh data website (MySQL) sebagai file <code className="rounded bg-[#FAF6F0] px-1.5 py-0.5 text-xs">.sql</code>.
                Hanya 30 backup terbaru yang disimpan di server.
              </p>
            </div>
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

        {msg && (
          <p className={`mt-4 rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg.text}
          </p>
        )}
      </div>

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
    </div>
  );
}