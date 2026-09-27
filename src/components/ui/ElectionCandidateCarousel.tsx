import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { resolveImageUrl } from '../../lib/api';
import type { OsisCandidate, OsisElection } from '../../lib/content-types';

interface ElectionCandidateCarouselProps {
  election: OsisElection;
  candidates: OsisCandidate[];
}

export default function ElectionCandidateCarousel({ election, candidates }: ElectionCandidateCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || candidates.length <= 1) return;
    const timer = window.setInterval(() => setIndex((prev) => (prev + 1) % candidates.length), 5000);
    return () => window.clearInterval(timer);
  }, [paused, candidates.length]);

  const active = candidates[index] ?? candidates[0];
  if (!active) return null;

  const totalVotes = candidates.reduce((sum, c) => sum + (c.votes ?? 0), 0);

  return (
    <section
      className="bg-[#FAF6F0] py-16 md:py-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            title="Pemilihan Ketua OSIS"
            subtitle={`${election.title}. Kenali visi & misi tiap pasangan calon sebelum memilih.`}
            align="left"
          />
          <Link to="/siswa/pemilihan-osis" className="mb-8 inline-flex items-center gap-2 font-semibold text-[#866D2C] transition-colors hover:text-[#1B2A4A]">
            Lihat Semua Kandidat <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="order-1 mx-auto w-full max-w-md lg:mx-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={String(active.id)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <CandidateSlideCard candidate={active} />
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex justify-center gap-2 lg:justify-start">
              {candidates.map((candidate, i) => (
                <button
                  key={String(candidate.id)}
                  type="button"
                  aria-label={`Tampilkan kandidat nomor ${candidate.number}`}
                  onClick={() => setIndex(i)}
                  className={`h-2.5 rounded-full transition-all ${
                    i === index ? 'w-7 bg-[#C8A951]' : 'w-2.5 bg-[#1B2A4A]/20 hover:bg-[#1B2A4A]/40'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="order-2 rounded-2xl border border-[#1B2A4A]/10 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#866D2C]">Perolehan Suara</p>
                <h3 className="mt-1 text-xl font-bold text-[#1B2A4A]">Hasil sementara</h3>
              </div>
              <span className="rounded-full bg-[#C8A951]/15 px-4 py-2 text-sm font-bold text-[#866D2C]">
                Total {totalVotes} suara
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {candidates.map((candidate) => {
                const votes = candidate.votes ?? 0;
                const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                return (
                  <Link
                    key={String(candidate.id)}
                    to="/siswa/pemilihan-osis"
                    className="group block rounded-xl border border-[#1B2A4A]/10 bg-[#FAF6F0]/60 p-4 transition-colors hover:border-[#C8A951]/60"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-[#1B2A4A]">
                        <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#C8A951] text-xs font-bold text-[#1B2A4A]">
                          {candidate.number}
                        </span>
                        {candidate.wakil_name ? `${candidate.name} & ${candidate.wakil_name}` : candidate.name}
                      </p>
                      <p className="text-sm font-bold text-[#866D2C]">{votes} suara · {pct}%</p>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#1B2A4A]/10">
                      <div className="h-full rounded-full bg-[#C8A951] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </Link>
                );
              })}
            </div>

            {totalVotes === 0 && (
              <p className="mt-4 text-sm text-[#5B7088]">Belum ada suara masuk.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function CandidateSlideCard({ candidate }: { candidate: OsisCandidate }) {
  const photo = resolveImageUrl(candidate.banner_photo) ?? resolveImageUrl(candidate.photo) ?? resolveImageUrl(candidate.wakil_photo);

  return (
    <Link
      to="/siswa/pemilihan-osis"
      className="group block overflow-hidden rounded-2xl border border-[#1B2A4A]/10 bg-white shadow-sm transition-all hover:border-[#C8A951]/60 hover:shadow-md"
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
          <span className="inline-flex items-center gap-1 text-sm font-bold text-[#866D2C] transition group-hover:text-[#C8A951]">
            Lihat visi &amp; misi <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
