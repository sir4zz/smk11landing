import { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AlertTriangle, Loader2, MessageCircle, Phone, QrCode, RefreshCw, Trash2 } from 'lucide-react';
import { whatsappApi } from '../../lib/api';

export default function WhatsAppManagement() {
  const [status, setStatus] = useState<{ connected: boolean; connectedAs: string | null; offline: boolean } | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const showQrRef = useRef(showQr);

  useEffect(() => {
    showQrRef.current = showQr;
  }, [showQr]);

  const loadStatus = useCallback(async () => {
    const { data } = await whatsappApi.status();
    if (data) {
      setStatus({ connected: !!data.connected, connectedAs: data.connectedAs ?? null, offline: !!data.offline });
      if (data.connected && showQrRef.current) {
        setShowQr(false);
        setQr(null);
        setMsg({ type: 'ok', text: 'WhatsApp berhasil terhubung!' });
      }
    }
    setLoading(false);
  }, []);

  const loadQr = useCallback(async () => {
    const { data, error } = await whatsappApi.qr();
    if (data?.qr) {
      setQr(data.qr);
    } else if (!data?.connected) {
      setMsg({ type: 'err', text: (error as { message?: string })?.message ?? 'QR belum tersedia.' });
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!showQr || status?.connected) return;
    void loadQr();
    const timer = setInterval(() => {
      void loadQr();
      void loadStatus();
    }, 3000);
    return () => clearInterval(timer);
  }, [showQr, status?.connected, loadQr, loadStatus]);

  const handleLogout = async () => {
    setLoggingOut(true);
    setMsg(null);
    const { error } = await whatsappApi.logout();
    if (!error) {
      setMsg({ type: 'ok', text: 'Session WhatsApp dihapus. Scan QR baru untuk pairing ulang.' });
      setShowLogoutConfirm(false);
      setShowQr(true);
      await loadStatus();
    } else {
      setMsg({ type: 'err', text: (error as { message?: string })?.message ?? 'Gagal menghapus session.' });
    }
    setLoggingOut(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`grid h-12 w-12 place-items-center rounded-xl ${status?.connected ? 'bg-green-100' : 'bg-[#FAF6F0]'}`}>
              <MessageCircle className={status?.connected ? 'text-green-600' : 'text-[#866D2C]'} size={24} />
            </div>
            <div>
              <h2 className="font-bold text-[#1B2A4A]">Notifikasi WhatsApp</h2>
              <p className="text-sm text-[#5B7088]">Kirim notifikasi verifikasi kelulusan &amp; perubahan data siswa.</p>
            </div>
          </div>
          <button onClick={() => { setLoading(true); void loadStatus(); }} className="rounded-lg border border-[#1B2A4A]/20 p-2 text-[#5B7088] hover:bg-[#FAF6F0]" title="Refresh status">
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-[#5B7088]"><Loader2 className="animate-spin" size={14} /> Memeriksa status...</p>
          ) : status?.offline ? (
            <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 shrink-0" size={16} />
              <span>WhatsApp service tidak berjalan. Jalankan <code className="rounded bg-red-100 px-1.5 py-0.5 font-mono">npm run server</code> di server sekolah.</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className={`h-2.5 w-2.5 rounded-full ${status?.connected ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="font-semibold text-[#1B2A4A]">{status?.connected ? 'Terhubung' : 'Belum terhubung'}</span>
              </div>

              {status?.connected && status.connectedAs && (
                <p className="flex items-center gap-2 text-sm text-[#23314D]">
                  <Phone size={14} className="text-[#5B7088]" />
                  Terhubung sebagai <span className="font-mono font-semibold">{`+${status.connectedAs}`}</span>
                </p>
              )}

              {!status?.connected && !showQr && (
                <button onClick={() => { setShowQr(true); setMsg(null); }} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 text-sm font-bold text-[#1B2A4A] hover:bg-[#b3954a]">
                  <QrCode size={16} /> Pairing via QR Code
                </button>
              )}
            </>
          )}
        </div>

        {msg && (
          <p className={`mt-4 rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>
        )}
      </div>

      {showQr && !status?.connected && (
        <div className="rounded-xl bg-white p-6 text-center shadow-sm">
          <h3 className="mb-1 font-bold text-[#1B2A4A]">Scan QR Code</h3>
          <p className="mx-auto mb-5 max-w-md text-sm text-[#5B7088]">
            Buka WhatsApp di HP &rarr; <strong>Perangkat Tertaut</strong> &rarr; <strong>Tautkan Perangkat</strong>, lalu arahkan ke QR di bawah ini.
          </p>
          <div className="mx-auto w-fit rounded-xl border border-[#1B2A4A]/10 bg-white p-4 shadow-inner">
            {qr ? (
              <QRCodeSVG value={qr} size={224} level="M" />
            ) : (
              <div className="grid h-[224px] w-[224px] place-items-center">
                <Loader2 className="animate-spin text-[#866D2C]" size={28} />
              </div>
            )}
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-[#5B7088]">
            <Loader2 className="animate-spin" size={12} /> QR otomatis diperbarui setiap 3 detik
          </p>
        </div>
      )}

      {status?.connected && (
        <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-red-700">Hapus Session WhatsApp</h3>
          <p className="mt-1 text-sm text-[#5B7088]">
            Melepas koneksi perangkat yang tertaut dan menghapus session. Setelah itu perlu scan QR lagi untuk menghubungkan ulang.
          </p>
          {!showLogoutConfirm ? (
            <button onClick={() => setShowLogoutConfirm(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">
              <Trash2 size={16} /> Hapus Session
            </button>
          ) : (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm font-semibold text-red-700">Yakin ingin menghapus session?</span>
              <button onClick={handleLogout} disabled={loggingOut} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
                {loggingOut ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />} Ya, Hapus
              </button>
              <button onClick={() => setShowLogoutConfirm(false)} disabled={loggingOut} className="rounded-lg border border-[#1B2A4A]/20 px-4 py-2 text-sm font-semibold text-[#1B2A4A] hover:bg-[#FAF6F0]">
                Batal
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
