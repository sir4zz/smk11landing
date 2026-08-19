import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { FileText, History, Loader2, Send, Trash2, CheckCircle2, XCircle, Clock, Ban } from 'lucide-react';
import { guruDataApi, GURU_CHANGE_REQUEST_STATUS_LABELS, resolveImageUrl } from '../../lib/api';
import type { GuruChangeRequestRow, GuruChangeRequestStatus, SdmGuruProfilePayload } from '../../lib/api';

type OfficialFieldKey = keyof SdmGuruProfilePayload;

interface OfficialFieldConfig {
  key: OfficialFieldKey;
  label: string;
  type: 'text' | 'date' | 'select' | 'textarea';
  options?: string[];
}

const OFFICIAL_FIELDS: OfficialFieldConfig[] = [
  { key: 'name', label: 'Nama Lengkap', type: 'text' },
  { key: 'nip', label: 'NIP', type: 'text' },
  { key: 'nipppk', label: 'NIPPPK', type: 'text' },
  { key: 'nuptk', label: 'NUPTK', type: 'text' },
  { key: 'nik', label: 'NIK', type: 'text' },
  { key: 'npwp', label: 'NPWP', type: 'text' },
  { key: 'akta_lahir', label: 'No. Akta Lahir', type: 'text' },
  { key: 'bpjs', label: 'No. BPJS', type: 'text' },
  { key: 'gender', label: 'Jenis Kelamin', type: 'select', options: ['', 'Laki-laki', 'Perempuan'] },
  { key: 'religion', label: 'Agama', type: 'text' },
  { key: 'birth_place', label: 'Tempat Lahir', type: 'text' },
  { key: 'birth_date', label: 'Tanggal Lahir', type: 'date' },
  { key: 'status_kepegawaian', label: 'Status Kepegawaian', type: 'select', options: ['', 'PNS', 'PPPK', 'Honorer Sekolah', 'Honorer Daerah', 'GTT', 'PTT'] },
  { key: 'pangkat_golongan', label: 'Pangkat / Golongan', type: 'text' },
  { key: 'jabatan', label: 'Jabatan', type: 'text' },
  { key: 'tmt_golongan', label: 'TMT Golongan', type: 'date' },
  { key: 'tmt_cpns', label: 'TMT CPNS', type: 'date' },
  { key: 'tmt_pns_pppk', label: 'TMT PNS / PPPK', type: 'date' },
  { key: 'tmt_sk_sekolah', label: 'TMT SK Sekolah', type: 'date' },
];

function valueOf(data: SdmGuruProfilePayload, field: OfficialFieldConfig): string {
  return String(data[field.key] ?? '');
}

function fmtDate(value: unknown): string {
  if (typeof value === 'string' && value) {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  }
  return String(value ?? '-') || '-';
}

export default function GuruSdmProfile({ data }: { data: SdmGuruProfilePayload }) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [requests, setRequests] = useState<GuruChangeRequestRow[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const field of OFFICIAL_FIELDS) {
      next[field.key] = valueOf(data, field);
    }
    setForm(next);
  }, [data]);

  const loadRequests = useCallback(async () => {
    const { data: rows, error } = await guruDataApi.myChangeRequests();
    if (!error && rows) setRequests(rows);
    setLoadingReqs(false);
  }, []);

  useEffect(() => { void loadRequests(); }, [loadRequests]);

  const setField = (key: OfficialFieldKey) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((v) => ({ ...v, [key]: e.target.value }));
  };

  const pending = requests.find((r) => r.status === 'menunggu');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMsg(null);

    const proposed: Record<string, unknown> = {};
    for (const field of OFFICIAL_FIELDS) {
      const current = valueOf(data, field);
      if (form[field.key] !== current) {
        proposed[field.key] = form[field.key] === '' ? null : form[field.key];
      }
    }

    if (Object.keys(proposed).length === 0) {
      flash('err', 'Tidak ada perubahan data yang diajukan.');
      setSaving(false);
      return;
    }

    try {
      const { error } = await guruDataApi.submitChangeRequest(proposed);
      if (error) throw new Error(error.message ?? 'Gagal mengajukan perubahan data.');
      await loadRequests();
      flash('ok', 'Pengajuan perubahan data berhasil dikirim. Menunggu verifikasi operator.');
    } catch (err) {
      flash('err', err instanceof Error ? err.message : 'Gagal mengajukan perubahan data.');
    } finally {
      setSaving(false);
    }
  };

  const cancel = async (id: string) => {
    if (!confirm('Batalkan pengajuan perubahan data ini?')) return;
    const { error } = await guruDataApi.cancelChangeRequest(id);
    if (error) {
      flash('err', error.message ?? 'Gagal membatalkan pengajuan.');
      return;
    }
    await loadRequests();
    flash('ok', 'Pengajuan dibatalkan.');
  };

  return (
    <div className="space-y-6">
      {msg && <p className={`rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-[#1B2A4A]"><FileText size={18} className="text-[#866D2C]" /> Data Pegawai (SDM)</h2>
        <p className="mb-5 text-sm text-[#5B7088]">Data resmi dari SDM sekolah. Perubahan diajukan melalui formulir di bawah dan harus diverifikasi operator.</p>
        <div className="flex items-center gap-4">
          {data.photo ? (
            <img src={resolveImageUrl(data.photo)} alt={data.name} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-full bg-[#FAF6F0] text-lg font-bold text-[#866D2C]">{data.name.charAt(0) || 'G'}</span>
          )}
          <div>
            <p className="text-xl font-bold text-[#1B2A4A]">{data.name}</p>
            <p className="text-sm text-[#5B7088]">{data.jabatan || '-'} {data.status_kepegawaian ? `\u2022 ${data.status_kepegawaian}` : ''}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-x-8 gap-y-2.5 text-sm sm:grid-cols-2">
          {OFFICIAL_FIELDS.map((field) => (
            <div key={field.key} className="flex gap-2">
              <dt className="w-44 shrink-0 font-medium text-[#5B7088]">{field.label}</dt>
              <dd className="font-semibold text-[#1B2A4A]">{field.key === 'birth_date' || field.key.startsWith('tmt_') ? fmtDate(data[field.key]) : String(data[field.key] ?? '-') || '-'}</dd>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-[#1B2A4A]"><Send size={18} className="text-[#866D2C]" /> Ajukan Perubahan Data</h2>
        <p className="mb-4 text-sm text-[#5B7088]">Ubah kolom yang dianggap kurang tepat lalu kirim pengajuan. Hanya kolom yang berbeda dari data saat ini yang dikirim.</p>

        {pending && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#C8A951]/40 bg-[#FFF9E8] p-3 text-sm">
            <span className="flex items-center gap-2 text-[#866D2C]"><Clock size={16} /> Anda memiliki pengajuan yang sedang menunggu verifikasi.</span>
            <button type="button" onClick={() => cancel(pending.id)} className="inline-flex items-center gap-1 rounded-lg border border-[#C8A951]/50 px-3 py-1.5 font-bold text-[#866D2C] hover:bg-[#C8A951]/10"><Ban size={14} /> Batalkan</button>
          </div>
        )}

        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          {OFFICIAL_FIELDS.map((field) => (
            <label key={field.key} className="block text-sm font-semibold">
              {field.label}
              {field.type === 'select' ? (
                <select value={form[field.key] ?? ''} onChange={setField(field.key)} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-2 font-normal">
                  {(field.options ?? []).map((o) => <option key={o} value={o}>{o || 'Pilih'}</option>)}
                </select>
              ) : (
                <input type={field.type} value={form[field.key] ?? ''} onChange={setField(field.key)} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-2 font-normal" />
              )}
            </label>
          ))}
          <div className="flex justify-end sm:col-span-2">
            <button type="submit" disabled={saving || !!pending} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Kirim Pengajuan
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-[#1B2A4A]"><History size={18} className="text-[#866D2C]" /> Riwayat Pengajuan</h2>
        {loadingReqs ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-[#C8A951]" /></div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-[#5B7088]">Belum ada pengajuan perubahan data.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF6F0] text-[#1B2A4A]">
                <tr>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Kolom Diubah</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Catatan</th>
                  <th className="p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const fields = Object.keys(r.proposed_data ?? {}).map((k) => OFFICIAL_FIELDS.find((f) => f.key === k)?.label ?? k);
                  return (
                    <tr key={r.id} className="border-t border-[#1B2A4A]/10">
                      <td className="p-3 whitespace-nowrap">{r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID') : '-'}</td>
                      <td className="p-3">{fields.length ? fields.join(', ') : '-'}</td>
                      <td className="p-3"><StatusBadge status={r.status} /></td>
                      <td className="p-3 max-w-[220px]">{r.rejection_reason ? <span className="text-red-600">{r.rejection_reason}</span> : <span className="text-[#5B7088]">-</span>}</td>
                      <td className="p-3 whitespace-nowrap">
                        {r.status === 'menunggu' && (
                          <button onClick={() => cancel(r.id)} className="inline-flex items-center gap-1 text-sm font-semibold text-red-600"><Trash2 size={14} /> Batalkan</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: GuruChangeRequestStatus }) {
  const map: Record<GuruChangeRequestStatus, { cls: string; icon: React.ReactNode }> = {
    menunggu: { cls: 'bg-[#C8A951]/20 text-[#866D2C]', icon: <Clock size={13} /> },
    disetujui: { cls: 'bg-green-50 text-green-700', icon: <CheckCircle2 size={13} /> },
    ditolak: { cls: 'bg-red-50 text-red-700', icon: <XCircle size={13} /> },
    dibatalkan: { cls: 'bg-gray-100 text-gray-600', icon: <Ban size={13} /> },
  };
  const item = map[status] ?? map.dibatalkan;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${item.cls}`}>
      {item.icon} {GURU_CHANGE_REQUEST_STATUS_LABELS[status] ?? status}
    </span>
  );
}