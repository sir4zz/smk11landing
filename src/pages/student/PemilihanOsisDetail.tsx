import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ShieldCheck, Vote } from 'lucide-react';
import { backendApi, electionApi, resolveImageUrl } from '../../lib/api';
import type { OsisElectionStudentState } from '../../lib/content-types';
import PageHero from '../../components/ui/PageHero';
import { SkeletonProfile } from '../../components/ui/Skeleton';

export default function PemilihanOsisDetail() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isStudent, setIsStudent] = useState(false);
  const [state, setState] = useState<OsisElectionStudentState | null>(null);

  const loadStatus = useCallback(async (asStudent: boolean) => {
    const { data } = asStudent
      ? await electionApi.studentStatus()
      : await electionApi.publicStatus();
    if (data) setState(data);
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="Detail Kandidat" subtitle="Area siswa SMKN 11" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Ruang Siswa', href: '/siswa/pemilihan-osis' }, { label: 'Detail Kandidat' }]} />
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <SkeletonProfile count={1} />
        </div>
      </div>
    );
  }

  const election = state?.election ?? null;
  const candidates = state?.candidates ?? [];
  const hasVoted = !!state?.has_voted;
  const myCandidateId = state?.my_candidate_id ?? null;
  const candidate = candidates.find((c) => String(c.id) === String(candidateId)) ?? null;
  const isMine = !!candidate && String(candidate.id) === String(myCandidateId);
  const canVote = !!election && election.is_active && !hasVoted;

  const backTo = '/siswa/pemilihan-osis';

  if (!election || !candidate) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="Detail Kandidat" subtitle="Area siswa SMKN 11" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Ruang Siswa', href: backTo }, { label: 'Detail Kandidat' }]} />
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-bold text-[#1B2A4A]">Kandidat tidak ditemukan</h2>
            <p className="mt-2 text-[#5B7088]">Halaman pemilihan mungkin sudah tidak tersedia.</p>
            <Link to={backTo} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-5 py-2.5 font-bold text-[#1B2A4A]">
              <ArrowLeft className="h-4 w-4" /> Kembali ke daftar kandidat
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const photo = resolveImageUrl(candidate.banner_photo) ?? resolveImageUrl(candidate.photo) ?? resolveImageUrl(candidate.wakil_photo);
  const wakilPhoto = resolveImageUrl(candidate.wakil_photo);
  const pick = () => navigate(backTo, { state: { selectId: candidate.id } });

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title={`Kandidat Nomor ${candidate.number}`}
        subtitle={candidate.wakil_name ? `${candidate.name} & ${candidate.wakil_name}` : candidate.name}
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Ruang Siswa', href: backTo }, { label: 'Pemilihan OSIS', href: backTo }, { label: `Nomor ${candidate.number}` }]}
      />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link to={backTo} className="inline-flex items-center gap-2 text-sm font-bold text-[#866D2C] hover:text-[#C8A951]">
            <ArrowLeft size={16} /> Kembali ke daftar kandidat
          </Link>
          <span className={`inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm ${isStudent ? 'text-[#1B2A4A]' : 'text-[#5B7088]'}`}>
            <ShieldCheck className={`h-4 w-4 ${isStudent ? 'text-[#C8A951]' : 'text-[#5B7088]'}`} />
            {isStudent ? 'Masuk sebagai siswa' : 'Anda melihat sebagai tamu'}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="relative w-full bg-[#FAF6F0]">
            {photo ? (
              <img src={photo} alt={candidate.name} className="h-auto max-h-[560px] w-full object-contain object-center" />
            ) : (
              <div className="grid h-72 place-items-center text-6xl font-bold text-[#C8A951] sm:h-96">{candidate.number}</div>
            )}
            <span className="absolute left-4 top-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#C8A951] text-lg font-bold text-[#1B2A4A] shadow">
              {candidate.number}
            </span>
            {hasVoted && isMine && (
              <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-[#1B2A4A] px-3 py-1.5 text-xs font-bold text-white">
                <CheckCircle2 className="h-3.5 w-3.5" /> Pilihan Anda
              </span>
            )}
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <PersonBlock role="Ketua" name={candidate.name} klass={candidate.class} photo={resolveImageUrl(candidate.photo)} />
              {candidate.wakil_name ? (
                <PersonBlock role="Wakil Ketua" name={candidate.wakil_name} klass={candidate.wakil_class} photo={wakilPhoto} />
              ) : (
                <div className="rounded-xl border border-dashed border-[#1B2A4A]/20 bg-[#FAF6F0] p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#866D2C]">Wakil Ketua</p>
                  <p className="mt-2 text-sm text-[#5B7088]">Pasangan ini mengusung calon ketua saja.</p>
                </div>
              )}
            </div>

            {candidate.vision && (
              <section className="mt-6 rounded-xl border border-[#1B2A4A]/10 bg-[#FAF6F0]/70 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-[#866D2C]">Visi</h3>
                <p className="mt-2 text-base leading-relaxed text-[#23314D]">{candidate.vision}</p>
              </section>
            )}

            {candidate.mission && (
              <section className="mt-4 rounded-xl border border-[#1B2A4A]/10 bg-[#FAF6F0]/70 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-[#866D2C]">Misi</h3>
                <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-[#23314D]">{candidate.mission}</p>
              </section>
            )}

            {!candidate.vision && !candidate.mission && (
              <p className="mt-6 rounded-xl bg-[#FAF6F0] p-5 text-sm text-[#5B7088]">Visi &amp; misi belum tersedia.</p>
            )}

            {typeof candidate.votes === 'number' && (
              <p className="mt-5 text-sm font-bold text-[#866D2C]">{candidate.votes} suara</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 shadow-sm">
          <p className="text-sm text-[#5B7088]">
            {!isStudent
              ? election.is_active
                ? 'Login sebagai siswa untuk memilih pasangan ini.'
                : 'Pemilihan sedang ditutup.'
              : hasVoted
                ? isMine ? 'Ini adalah pasangan pilihan Anda.' : 'Anda sudah memberikan suara.'
                : election.is_active ? 'Puas dengan visi & misi ini? Pilih pasangan ini.' : 'Pemilihan sedang ditutup.'}
          </p>
          {!isStudent ? (
            <button
              onClick={() => navigate(`/mading/login?returnUrl=${encodeURIComponent(location.pathname)}`)}
              disabled={!election.is_active}
              className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-6 py-2.5 font-bold text-[#1B2A4A] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" /> Login untuk Memilih
            </button>
          ) : canVote ? (
            <button
              onClick={pick}
              className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-6 py-2.5 font-bold text-[#1B2A4A] transition hover:brightness-105"
            >
              <Vote className="h-4 w-4" /> Pilih Pasangan Ini
            </button>
          ) : (
            <Link
              to={backTo}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-6 py-2.5 font-bold text-white transition hover:bg-[#15203a]"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function PersonBlock({ role, name, klass, photo }: { role: string; name: string; klass: string; photo?: string | null }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[#1B2A4A]/10 bg-white p-5 shadow-sm">
      {photo ? (
        <img src={photo} alt={name} className="h-20 w-20 shrink-0 rounded-full object-cover object-top" />
      ) : (
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[#FAF6F0] text-2xl font-bold text-[#C8A951]">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[#866D2C]">{role}</p>
        <p className="mt-1 text-lg font-bold text-[#1B2A4A]">{name}</p>
        <p className="text-sm font-semibold text-[#5B7088]">{klass || '—'}</p>
      </div>
    </div>
  );
}
