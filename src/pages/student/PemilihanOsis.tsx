import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Loader2, LogOut, ShieldCheck, Vote, XCircle } from 'lucide-react';
import { backendApi, electionApi, resolveImageUrl } from '../../lib/api';
import type { OsisCandidate, OsisElectionStudentState } from '../../lib/content-types';
import PageHero from '../../components/ui/PageHero';
import { SkeletonProfile } from '../../components/ui/Skeleton';

const studentSessionKey = 'smkn11-student-session';

type Flash = { type: 'ok' | 'err'; text: string } | null;

function pairNames(c: OsisCandidate) {
  return c.wakil_name ? `${c.name} & ${c.wakil_name}` : c.name;
}

function pairClasses(c: OsisCandidate) {
  const parts = [c.class || '—'];
  if (c.wakil_name) parts.push(c.wakil_class || '—');
  return parts.join(' / ');
}

export default function PemilihanOsis() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isStudent, setIsStudent] = useState(false);
  const [state, setState] = useState<OsisElectionStudentState | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<Flash>(null);

  const flashMsg = useCallback((type: 'ok' | 'err', text: string) => {
    setFlash({ type, text });
    setTimeout(() => setFlash(null), 5000);
  }, []);

  const loadStatus = useCallback(async (asStudent: boolean) => {
    const { data, error } = asStudent
      ? await electionApi.studentStatus()
      : await electionApi.publicStatus();
    if (error) {
      flashMsg('err', error.message || 'Gagal memuat data pemilihan.');
      return;
    }
    if (data) setState(data);
  }, [flashMsg]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await backendApi.auth.getCurrentUser();
      if (cancelled) return;
      let student = false;
      if (data?.user) {
        const { data: prof } = await backendApi.database.from('profiles').select('role').eq('id', data.user.id).single();
        if (cancelled) return;
        student = prof?.role === 'student';
      }
      if (cancelled) return;
      setIsStudent(student);
      await loadStatus(student);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [loadStatus]);

  useEffect(() => {
    const pickId = (location.state as { selectId?: string } | null)?.selectId;
    if (pickId) setSelectedId(String(pickId));
  }, [location.state]);

  const loginPath = () => `/mading/login?returnUrl=${encodeURIComponent(location.pathname)}`;

  const logout = async () => {
    await backendApi.auth.signOut();
    localStorage.removeItem(studentSessionKey);
    navigate('/mading/login');
  };

  const submitVote = async () => {
    if (!selectedId) return;
    if (!isStudent) {
      navigate(loginPath());
      return;
    }
    setSubmitting(true);
    const { data, error } = await electionApi.vote(selectedId);
    setSubmitting(false);
    setConfirming(false);
    if (error) {
      flashMsg('err', error.message || 'Gagal mencatat suara Anda.');
      if (error.message?.toLowerCase().includes('sudah memilih')) {
        await loadStatus(true);
      }
      return;
    }
    if (data) setState(data);
    setSelectedId(null);
    flashMsg('ok', 'Suara Anda berhasil dicatat. Terima kasih!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="Pemilihan OSIS" subtitle="Area siswa SMKN 11" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Ruang Siswa' }, { label: 'Pemilihan OSIS' }]} />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <SkeletonProfile count={3} />
        </div>
      </div>
    );
  }

  const election = state?.election ?? null;
  const candidates = state?.candidates ?? [];
  const hasVoted = !!state?.has_voted;
  const myCandidateId = state?.my_candidate_id ?? null;
  const activeCandidates = candidates.filter((c) => c.is_active !== false);
  const totalVotes = activeCandidates.reduce((sum, c) => sum + (c.votes ?? 0), 0);
  const selected = activeCandidates.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Pemilihan OSIS"
        subtitle="Pilih calon ketua & wakil ketua OSIS — satu siswa, satu suara"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Ruang Siswa' }, { label: 'Pemilihan OSIS' }]}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          {isStudent ? (
            <>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#1B2A4A] shadow-sm">
                <ShieldCheck className="h-4 w-4 text-[#C8A951]" /> Masuk sebagai siswa
              </div>
              <button onClick={logout} className="inline-flex items-center gap-2 text-sm font-bold text-[#866D2C] hover:text-[#C8A951]">
                <LogOut size={16} /> Keluar
              </button>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#1B2A4A] shadow-sm">
                <ShieldCheck className="h-4 w-4 text-[#5B7088]" /> Anda melihat sebagai tamu
              </div>
              <button
                onClick={() => navigate(loginPath())}
                className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-4 py-2 text-sm font-bold text-[#1B2A4A] transition hover:brightness-105"
              >
                Login Siswa
              </button>
            </>
          )}
        </div>

        {flash && (
          <p className={`mb-6 rounded-lg p-3 text-sm ${flash.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {flash.text}
          </p>
        )}

        {!election && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <Vote className="mx-auto h-10 w-10 text-[#C8A951]" />
            <h2 className="mt-4 text-xl font-bold text-[#1B2A4A]">Halaman tidak tersedia</h2>
            <p className="mt-2 text-[#5B7088]">Pemilihan OSIS sedang tidak aktif. Silakan cek kembali nanti.</p>
          </div>
        )}

        {election && activeCandidates.length === 0 && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <Vote className="mx-auto h-10 w-10 text-[#C8A951]" />
            <h2 className="mt-4 text-xl font-bold text-[#1B2A4A]">Belum ada kandidat</h2>
            <p className="mt-2 text-[#5B7088]">Daftar kandidat sedang disiapkan. Silakan cek kembali nanti.</p>
          </div>
        )}

        {election && activeCandidates.length > 0 && (
          <>
            <div className="mb-8 rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#866D2C]">Pemilihan berlangsung</p>
                  <h2 className="mt-1 text-2xl font-bold text-[#1B2A4A]">{election.title}</h2>
                  {election.description && (
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#5B7088]">{election.description}</p>
                  )}
                </div>
                {hasVoted ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-700">
                    <CheckCircle2 className="h-4 w-4" /> Anda sudah memilih
                  </span>
                ) : election.is_active ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#C8A951]/15 px-4 py-2 text-sm font-bold text-[#866D2C]">
                    <Vote className="h-4 w-4" /> Pilihan dibuka
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#FAF6F0] px-4 py-2 text-sm font-bold text-[#5B7088]">
                    <XCircle className="h-4 w-4" /> Pemilihan ditutup
                  </span>
                )}
              </div>
            </div>

            {hasVoted && myCandidateId && (() => {
              const mine = activeCandidates.find((c) => c.id === myCandidateId);
              if (!mine) return null;
              return (
                <div className="mb-6 rounded-xl border border-[#C8A951]/40 bg-[#C8A951]/10 p-4 text-sm text-[#23314D]">
                  Pilihan Anda: <strong>{pairNames(mine)}</strong>
                  {mine.number ? ` (Nomor urut ${mine.number})` : ''}
                </div>
              );
            })()}

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {activeCandidates.map((candidate) => (
                <CandidateCard
                  key={String(candidate.id)}
                  candidate={candidate}
                  hasVoted={hasVoted}
                  isMine={candidate.id === myCandidateId}
                  isSelected={candidate.id === selectedId}
                  canSelect={!hasVoted && election.is_active}
                  onSelect={() => {
                    if (!isStudent) {
                      navigate(loginPath());
                      return;
                    }
                    setSelectedId(candidate.id ?? null);
                  }}
                />
              ))}
            </div>

            {!hasVoted && election.is_active && (
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 shadow-sm">
                <p className="text-sm text-[#5B7088]">
                  {!isStudent
                    ? 'Login sebagai siswa untuk memberikan suara.'
                    : selected
                      ? <>Anda memilih: <strong className="text-[#1B2A4A]">Nomor {selected.number} — {pairNames(selected)}</strong></>
                      : 'Pilih salah satu pasangan kandidat untuk melanjutkan.'}
                </p>
                {!isStudent ? (
                  <button
                    onClick={() => navigate(loginPath())}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-6 py-2.5 font-bold text-[#1B2A4A] transition hover:brightness-105"
                  >
                    <ShieldCheck className="h-4 w-4" /> Login untuk Memilih
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirming(true)}
                    disabled={!selected}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-6 py-2.5 font-bold text-[#1B2A4A] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Vote className="h-4 w-4" /> Konfirmasi Pilihan
                  </button>
                )}
              </div>
            )}

            <div className="mt-8 rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-[#1B2A4A]">Hasil Perolehan Suara</h3>
                  <span className="text-sm font-semibold text-[#5B7088]">Total {totalVotes} suara</span>
                </div>
                <div className="space-y-4">
                  {activeCandidates.map((candidate) => {
                    const votes = candidate.votes ?? 0;
                    const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                    const isMine = candidate.id === myCandidateId;
                    return (
                      <div key={String(candidate.id)} className={`rounded-xl border p-4 ${isMine ? 'border-[#C8A951] bg-[#C8A951]/10' : 'border-[#1B2A4A]/10 bg-[#FAF6F0]/60'}`}>
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <p className="font-bold text-[#1B2A4A]">
                            <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#C8A951] text-xs font-bold text-[#1B2A4A]">{candidate.number}</span>
                            {pairNames(candidate)}
                            {isMine && <span className="ml-2 rounded-full bg-[#1B2A4A] px-2 py-0.5 text-xs font-semibold text-white">Pilihan Anda</span>}
                          </p>
                          <p className="text-sm font-bold text-[#866D2C]">{votes} suara · {pct}%</p>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-[#1B2A4A]/10">
                          <div className="h-full rounded-full bg-[#C8A951] transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
          </>
        )}
      </div>

      {confirming && selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-[#1B2A4A]">Konfirmasi Pilihan</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#23314D]">
              Anda akan memilih <strong>Nomor {selected.number} — {pairNames(selected)}</strong> dari kelas {pairClasses(selected)}. Suara tidak dapat diubah setelah dikirim.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setConfirming(false)} disabled={submitting} className="px-4 py-2 text-[#5B7088]">
                Batal
              </button>
              <button
                onClick={submitVote}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-5 py-2.5 font-bold text-[#1B2A4A] disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Kirim Suara
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CandidateCard({
  candidate,
  hasVoted,
  isMine,
  isSelected,
  canSelect,
  onSelect,
}: {
  candidate: OsisCandidate;
  hasVoted: boolean;
  isMine: boolean;
  isSelected: boolean;
  canSelect: boolean;
  onSelect: () => void;
}) {
  const photo = resolveImageUrl(candidate.banner_photo) ?? resolveImageUrl(candidate.photo) ?? resolveImageUrl(candidate.wakil_photo);
  const highlight = hasVoted ? isMine : isSelected;
  const detailPath = `/siswa/pemilihan-osis/${candidate.id}`;

  return (
    <div
      role={canSelect ? 'button' : undefined}
      tabIndex={canSelect ? 0 : undefined}
      onClick={canSelect ? onSelect : undefined}
      onKeyDown={(e) => {
        if (!canSelect) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`group overflow-hidden rounded-2xl border-2 bg-white text-left shadow-sm transition-all ${
        highlight
          ? 'border-[#C8A951] bg-[#C8A951]/10'
          : 'border-transparent hover:border-[#C8A951]/40 hover:shadow-md'
      } ${canSelect ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="relative w-full bg-[#FAF6F0]">
        {photo ? (
          <img src={photo} alt={candidate.name} className="h-auto max-h-[480px] w-full object-contain object-center" />
        ) : (
          <div className="grid h-64 place-items-center text-5xl font-bold text-[#C8A951]">{candidate.number}</div>
        )}
        <span className="absolute left-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#C8A951] text-sm font-bold text-[#1B2A4A] shadow">
          {candidate.number}
        </span>
        {hasVoted && isMine && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#1B2A4A] px-3 py-1 text-xs font-bold text-white">
            <CheckCircle2 className="h-3 w-3" /> Pilihan Anda
          </span>
        )}
        {!hasVoted && isSelected && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#C8A951] px-3 py-1 text-xs font-bold text-[#1B2A4A]">
            Dipilih
          </span>
        )}
      </div>
      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-[#866D2C]">Ketua</p>
        <h3 className="mt-0.5 text-lg font-bold text-[#1B2A4A]">{candidate.name}</h3>
        <p className="text-sm font-semibold text-[#5B7088]">{candidate.class || '—'}</p>
        {candidate.wakil_name && (
          <>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#866D2C]">Wakil Ketua</p>
            <h3 className="mt-0.5 text-base font-bold text-[#1B2A4A]">{candidate.wakil_name}</h3>
            <p className="text-sm font-semibold text-[#5B7088]">{candidate.wakil_class || '—'}</p>
          </>
        )}
        {candidate.vision && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#5B7088]">{candidate.vision}</p>
        )}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#1B2A4A]/10 pt-3">
          <span className="text-sm font-bold text-[#866D2C]">
            {typeof candidate.votes === 'number' ? `${candidate.votes} suara` : ''}
          </span>
          <Link
            to={detailPath}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-sm font-bold text-[#866D2C] transition hover:text-[#C8A951]"
          >
            Lihat visi &amp; misi <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
