import { useCallback, useEffect, useState } from 'react';
import { Loader2, Search, Eye, X, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { guruChangeRequestAdminApi, GURU_CHANGE_REQUEST_STATUS_LABELS, type GuruChangeRequestRow, type GuruChangeRequestStatus } from '../../lib/api';

const FIELD_LABELS: Record<string, string> = {
  name: 'Nama Lengkap',
  nip: 'NIP',
  nipppk: 'NIPPPK',
  nuptk: 'NUPTK',
  nik: 'NIK',
  npwp: 'NPWP',
  akta_lahir: 'No. Akta Lahir',
  bpjs: 'No. BPJS',
  gender: 'Jenis Kelamin',
  religion: 'Agama',
  birth_place: 'Tempat Lahir',
  birth_date: 'Tanggal Lahir',
  status_kepegawaian: 'Status Kepegawaian',
  pangkat_golongan: 'Pangkat / Golongan',
  jabatan: 'Jabatan',
  tmt_golongan: 'TMT Golongan',
  tmt_cpns: 'TMT CPNS',
  tmt_pns_pppk: 'TMT PNS / PPPK',
  tmt_sk_sekolah: 'TMT SK Sekolah',
};

function fmtDate(value: unknown): string {
  if (typeof value === 'string' && value) {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  }
  return String(value ?? '');
}

const statusStyles: Record<string, string> = {
  menunggu: 'bg-[#C8A951]/20 text-[#866D2C]',
  disetujui: 'bg-green-50 text-green-700',
  ditolak: 'bg-red-50 text-red-700',
  dibatalkan: 'bg-[#FAF6F0] text-[#5B7088]',
};

const statusIcons: Record<string, typeof Clock> = {
  menunggu: Clock,
  disetujui: CheckCircle2,
  ditolak: XCircle,
  dibatalkan: XCircle,
};

export default function GuruChangeRequestsManagement() {
  const [requests, setRequests] = useState<GuruChangeRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailRequest, setDetailRequest] = useState<GuruChangeRequestRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await guruChangeRequestAdminApi.list({
      status: statusFilter || undefined,
      search: search || undefined,
    });
    if (data) setRequests(data as GuruChangeRequestRow[]);
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => { void load(); }, [load]);

  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetailLoading(true);
    const { data } = await guruChangeRequestAdminApi.get(id);
    if (data) setDetailRequest(data as GuruChangeRequestRow);
    setDetailLoading(false);
  };

  const closeDetail = () => {
    setDetailId(null);
    setDetailRequest(null);
  };

  return (
    <div className="space-y-6">
      <p className="text-[#23314D]">Kelola pengajuan perubahan data guru (SDM) yang diajukan melalui halaman Profil Saya guru.</p>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#23314D]/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama / NIP / NUPTK guru..."
            className="w-full rounded-lg border border-[#1B2A4A]/20 bg-white py-2 pl-10 pr-4 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[#1B2A4A]/20 bg-white px-4 py-2 text-sm"
        >
          <option value="">Semua Status</option>
          <option value="menunggu">Menunggu Verifikasi</option>
          <option value="disetujui">Disetujui</option>
          <option value="ditolak">Ditolak</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" /></div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <Clock className="mx-auto mb-3 h-10 w-10 text-[#C8A951]/40" />
          <p className="text-[#5B7088]">Tidak ada pengajuan ditemukan.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAF6F0] text-[#1B2A4A]">
              <tr>
                <th className="p-4">Guru</th>
                <th className="p-4">NIP</th>
                <th className="p-4">NUPTK</th>
                <th className="p-4">Field Diubah</th>
                <th className="p-4">Status</th>
                <th className="p-4">Tanggal Pengajuan</th>
                <th className="p-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => {
                const Icon = statusIcons[req.status] ?? Clock;
                const fieldCount = Object.keys(req.proposed_data).length;
                return (
                  <tr key={req.id} className="border-t border-[#1B2A4A]/10">
                    <td className="p-4 font-semibold">{req.guru?.name ?? '-'}</td>
                    <td className="p-4 font-mono text-xs">{req.guru?.nip ?? '-'}</td>
                    <td className="p-4 font-mono text-xs">{req.guru?.nuptk ?? '-'}</td>
                    <td className="p-4">{fieldCount} field</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[req.status] ?? ''}`}>
                        <Icon className="h-3 w-3" /> {GURU_CHANGE_REQUEST_STATUS_LABELS[req.status as GuruChangeRequestStatus] ?? req.status}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap text-xs">
                      {req.created_at ? new Date(req.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <button onClick={() => openDetail(req.id)} className="inline-flex items-center gap-1 text-sm font-semibold text-[#866D2C]">
                        <Eye size={15} /> Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {detailId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 py-10">
          <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            {detailLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" /></div>
            ) : detailRequest ? (
              <DetailContent
                request={detailRequest}
                onClose={closeDetail}
                onVerified={async () => {
                  closeDetail();
                  await load();
                }}
              />
            ) : (
              <div className="text-center text-[#5B7088]">Data tidak ditemukan.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailContent({ request, onClose, onVerified }: { request: GuruChangeRequestRow; onClose: () => void; onVerified: () => void }) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const changedKeys = Object.keys(request.proposed_data);

  const handleVerify = async () => {
    if (!action) return;
    setSaving(true);
    setMsg(null);

    const { error } = await guruChangeRequestAdminApi.verify(request.id, {
      status: action === 'approve' ? 'disetujui' : 'ditolak',
      rejection_reason: action === 'reject' ? reason : undefined,
    });

    setSaving(false);

    if (error) {
      setMsg({ type: 'err', text: error.message ?? 'Gagal memproses verifikasi.' });
      return;
    }

    setMsg({ type: 'ok', text: action === 'approve' ? 'Pengajuan disetujui. Data guru telah diperbarui.' : 'Pengajuan ditolak.' });
    setTimeout(() => onVerified(), 1500);
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-[#1B2A4A]">Detail Pengajuan Perubahan Data Guru</h3>
          <p className="mt-1 text-sm text-[#5B7088]">{request.guru?.name} — NIP {request.guru?.nip || '-'}</p>
        </div>
        <button onClick={onClose}><X className="h-5 w-5" /></button>
      </div>

      {msg && <p className={`mb-4 rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}

      <div className="mb-4 rounded-lg bg-[#FAF6F0] p-3 text-xs text-[#5B7088]">
        Diajukan {request.created_at ? new Date(request.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
        {request.verified_at && <> — Diverifikasi {new Date(request.verified_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} oleh {request.verifier?.name ?? '-'}</>}
      </div>

      {request.status === 'ditolak' && request.rejection_reason && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <strong>Alasan Penolakan Sebelumnya:</strong> {request.rejection_reason}
        </div>
      )}

      {/* Comparison Table */}
      <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-[#1B2A4A]/10">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-[#FAF6F0]">
            <tr>
              <th className="p-3 font-semibold text-[#1B2A4A]">Field</th>
              <th className="p-3 font-semibold text-[#1B2A4A]">Data Lama</th>
              <th className="p-3 font-semibold text-[#1B2A4A]">Data Baru (Diajukan)</th>
            </tr>
          </thead>
          <tbody>
            {changedKeys.map((key) => {
              const label = FIELD_LABELS[key] ?? key;
              const oldVal = request.old_data[key];
              const newVal = request.proposed_data[key];
              const isChanged = String(oldVal ?? '') !== String(newVal ?? '');
              const isDate = key === 'birth_date' || key.startsWith('tmt_');
              return (
                <tr key={key} className={`border-t border-[#1B2A4A]/10 ${isChanged ? 'bg-green-50/50' : ''}`}>
                  <td className="p-3 font-medium text-[#5B7088]">{label}</td>
                  <td className="p-3 text-[#1B2A4A]">{oldVal === null || oldVal === undefined || oldVal === '' ? '-' : (isDate ? fmtDate(oldVal) : String(oldVal))}</td>
                  <td className="p-3 font-semibold text-green-700">{newVal === null || newVal === undefined || newVal === '' ? '-' : (isDate ? fmtDate(newVal) : String(newVal))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      {request.status === 'menunggu' && (
        <div className="mt-5 space-y-4">
          {action && (
            <div>
              {action === 'reject' && (
                <label className="block text-sm font-semibold">
                  Alasan Penolakan
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal"
                    placeholder="Jelaskan alasan penolakan..."
                  />
                </label>
              )}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-[#5B7088]">Tutup</button>
            {!action ? (
              <>
                <button onClick={() => setAction('reject')} className="inline-flex items-center gap-2 rounded-lg border-2 border-red-500 px-5 py-2 font-bold text-red-600 hover:bg-red-50">
                  <XCircle size={16} /> Tolak
                </button>
                <button onClick={() => setAction('approve')} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 font-bold text-white hover:bg-green-700">
                  <CheckCircle2 size={16} /> Setujui
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setAction(null); setReason(''); }} className="px-4 py-2 text-[#5B7088]">Batal</button>
                <button
                  onClick={handleVerify}
                  disabled={saving || (action === 'reject' && !reason.trim())}
                  className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 font-bold text-white disabled:opacity-60 ${
                    action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : action === 'approve' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  {action === 'approve' ? 'Konfirmasi Setujui' : 'Konfirmasi Tolak'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}