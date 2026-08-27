import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Globe, Link2, Mail, Phone, MapPin, Medal, Award, Briefcase, GraduationCap, Users, BookOpen, Compass, ArrowLeft, Trophy, Camera, ThumbsUp, MessageCircle, Music2, Video, Contact, Code } from 'lucide-react';
import PageHero from '../../components/ui/PageHero';
import { publicProfileApi, resolveImageUrl, type PublicProfile, type PublicProfileType, type PublicSdmProfile } from '../../lib/api';
import { formatClass } from '../../lib/studentBiodata';
import { usePageBanner } from '../../lib/usePageBanner';
import { SkeletonProfile } from '../../components/ui/Skeleton';

const ROLE_META: Record<string, { label: string; badge: string }> = {
  guru: { label: 'Guru', badge: 'bg-blue-50 text-blue-700' },
  tendik: { label: 'Tenaga Kependidikan', badge: 'bg-purple-50 text-purple-700' },
  siswa: { label: 'Siswa', badge: 'bg-green-50 text-green-700' },
  osis: { label: 'Pengurus OSIS', badge: 'bg-[#C8A951]/20 text-[#866D2C]' },
};

function isSdmProfile(p: PublicProfile | PublicSdmProfile): p is PublicSdmProfile {
  return p.role === 'tendik' || Array.isArray((p as PublicSdmProfile).education);
}

const SOCIAL_ICONS: Record<string, typeof Link2> = {
  instagram: Camera,
  facebook: ThumbsUp,
  twitter: MessageCircle,
  youtube: Video,
  linkedin: Contact,
  github: Code,
  website: Globe,
  tiktok: Music2,
};

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'X (Twitter)',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  website: 'Website',
  github: 'GitHub',
};

function ProfilePage() {
  const { backgroundImage } = usePageBanner('profil_guru');
  const { role, id } = useParams<{ role: string; id: string }>();
  const [profile, setProfile] = useState<PublicProfile | PublicSdmProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    const type = (role as PublicProfileType) || 'guru';
    publicProfileApi.get(type, id ?? '').then(({ data, error }) => {
      if (!active) return;
      if (data) {
        setProfile(data);
      } else if (error) {
        setNotFound(true);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [role, id]);

  const meta = ROLE_META[role ?? ''] ?? ROLE_META.guru;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="Profil" subtitle="Profil warga SMKN 11" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Profil' }]} backgroundImage={backgroundImage} />
        <div className="py-24"><div className="mx-auto max-w-xl"><SkeletonProfile count={1} /></div></div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="Profil" subtitle="Profil warga SMKN 11" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Profil' }]} backgroundImage={backgroundImage} />
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <Compass className="mx-auto mb-4 h-12 w-12 text-[#C8A951]/50" />
          <h2 className="text-2xl font-bold text-[#1B2A4A]">Profil tidak ditemukan</h2>
          <p className="mt-2 text-[#5B7088]">Halaman ini mungkin telah dihapus atau identitas tidak dikenal.</p>
          <Link to="/profil/direktori" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2.5 font-bold text-white"><ArrowLeft size={16} /> Lihat Direktori</Link>
        </div>
      </div>
    );
  }

  if (isSdmProfile(profile)) {
    return <SdmProfileView profile={profile} meta={ROLE_META[role ?? ''] ?? ROLE_META.guru} />;
  }

  const socials = Object.entries(profile.social ?? {}).filter(([, value]) => value && String(value).trim());

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title={profile.name}
        subtitle={`${meta.label} SMKN 11 Kabupaten Tangerang`}
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Profil', href: '/profil/direktori' }, { label: meta.label }]}
        backgroundImage={backgroundImage}
      />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-[320px_1fr]">
          <div>
            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 grid h-28 w-28 sm:h-40 sm:w-40 place-items-center overflow-hidden rounded-full border-4 border-[#C8A951]/50 bg-[#FAF6F0]">
                {resolveImageUrl(profile.photo) ? (
                  <img src={resolveImageUrl(profile.photo)} alt={profile.name} className="h-full w-full object-cover" />
                ) : (
                  <Users className="h-10 w-10 sm:h-16 sm:w-16 text-[#C8A951]/60" />
                )}
              </div>
              <h1 className="text-xl font-bold text-[#1B2A4A]">{profile.name}</h1>
              <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${meta.badge}`}>{meta.label}</span>
              {(profile.position || profile.division) && (
                <p className="mt-3 text-sm font-semibold text-[#866D2C]">
                  {[profile.division, profile.position].filter(Boolean).join(' · ')}
                </p>
              )}
              {profile.subject && <p className="mt-1 text-sm text-[#5B7088]">{profile.subject}</p>}
              {profile.class && profile.major && <p className="mt-1 text-sm text-[#5B7088]">{formatClass(profile.class)} · {profile.major}</p>}

              {(profile.email || profile.phone || profile.address) && (
                <div className="mt-5 space-y-2 border-t border-[#1B2A4A]/10 pt-5 text-left text-sm">
                  {profile.email && (
                    <a href={`mailto:${profile.email}`} className="flex items-center gap-2 text-[#23314D] hover:text-[#866D2C]"><Mail size={15} className="shrink-0 text-[#866D2C]" /> <span className="break-all">{profile.email}</span></a>
                  )}
                  {profile.phone && (
                    <a href={`tel:${profile.phone}`} className="flex items-center gap-2 text-[#23314D] hover:text-[#866D2C]"><Phone size={15} className="shrink-0 text-[#866D2C]" /> {profile.phone}</a>
                  )}
                  {profile.address && (
                    <p className="flex items-start gap-2 text-[#23314D]"><MapPin size={15} className="mt-0.5 shrink-0 text-[#866D2C]" /> {profile.address}</p>
                  )}
                </div>
              )}

              {socials.length > 0 && (
                <div className="mt-5 flex flex-wrap justify-center gap-2 border-t border-[#1B2A4A]/10 pt-5">
                  {socials.map(([key, value]) => {
                    const Icon = SOCIAL_ICONS[key] ?? Link2;
                    const href = String(value).startsWith('http') ? String(value) : `https://${String(value)}`;
                    return (
                      <a key={key} href={href} target="_blank" rel="noreferrer" title={SOCIAL_LABELS[key] ?? key}
                        className="grid h-10 w-10 place-items-center rounded-full bg-[#1B2A4A] text-white transition-colors hover:bg-[#866D2C]">
                        <Icon size={18} />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {profile.bio && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-3 flex items-center gap-2 font-bold text-[#1B2A4A]"><Compass size={18} className="text-[#866D2C]" /> Tentang Saya</h2>
                <p className="whitespace-pre-wrap text-sm leading-7 text-[#23314D]">{profile.bio}</p>
              </div>
            )}

            {profile.achievements && profile.achievements.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 font-bold text-[#1B2A4A]"><Trophy size={18} className="text-[#866D2C]" /> Prestasi</h2>
                <ul className="space-y-2">
                  {profile.achievements.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#23314D]"><Medal size={15} className="mt-0.5 shrink-0 text-[#C8A951]" /> {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {profile.certifications && profile.certifications.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 font-bold text-[#1B2A4A]"><Award size={18} className="text-[#866D2C]" /> Sertifikasi</h2>
                <ul className="space-y-2">
                  {profile.certifications.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#23314D]"><Briefcase size={15} className="mt-0.5 shrink-0 text-[#C8A951]" /> {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {profile.work_programs && profile.work_programs.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 font-bold text-[#1B2A4A]"><BookOpen size={18} className="text-[#866D2C]" /> Program Kerja</h2>
                <ul className="space-y-2">
                  {profile.work_programs.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#23314D]"><GraduationCap size={15} className="mt-0.5 shrink-0 text-[#C8A951]" /> {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {profile.works && profile.works.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 font-bold text-[#1B2A4A]"><BookOpen size={18} className="text-[#866D2C]" /> Karya di Mading</h2>
                <div className="space-y-4">
                  {profile.works.map((work, i) => (
                    <article key={i} className="rounded-xl border border-[#1B2A4A]/10 bg-[#FAF6F0] p-4">
                      <h3 className="font-bold text-[#1B2A4A]">{work.title}</h3>
                      <p className="mt-1 line-clamp-3 text-sm leading-6 text-[#23314D]">{work.content}</p>
                      <p className="mt-2 text-xs text-[#5B7088]">{work.published_at ? new Date(work.published_at).toLocaleDateString('id-ID') : ''}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <Link to="/profil/direktori" className="inline-flex items-center gap-2 text-sm font-bold text-[#866D2C] hover:text-[#C8A951]"><ArrowLeft size={16} /> Kembali ke Direktori Profil</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;

function SdmProfileView({ profile, meta }: { profile: PublicSdmProfile; meta: { label: string; badge: string } }) {
  const { backgroundImage } = usePageBanner('profil_guru');
  const educations = profile.education ?? [];
  const assignments = profile.assignments ?? [];
  const socials = Object.entries(profile.social ?? {}).filter(([, value]) => value && String(value).trim());

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title={profile.name}
        subtitle={`${meta.label} SMKN 11 Kabupaten Tangerang`}
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Profil', href: '/profil/direktori' }, { label: meta.label }]}
        backgroundImage={backgroundImage}
      />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-[320px_1fr]">
          <div>
            <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 grid h-28 w-28 sm:h-40 sm:w-40 place-items-center overflow-hidden rounded-full border-4 border-[#C8A951]/50 bg-[#FAF6F0]">
                {resolveImageUrl(profile.photo) ? (
                  <img src={resolveImageUrl(profile.photo)} alt={profile.name} className="h-full w-full object-cover" />
                ) : (
                  <Users className="h-10 w-10 sm:h-16 sm:w-16 text-[#C8A951]/60" />
                )}
              </div>
              <h1 className="text-xl font-bold text-[#1B2A4A]">{profile.name}</h1>
              <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${meta.badge}`}>{meta.label}</span>
              {profile.position && <p className="mt-3 text-sm font-semibold text-[#866D2C]">{profile.position}</p>}
              {profile.subject && <p className="mt-1 text-sm text-[#5B7088]">{profile.subject}</p>}
              {profile.certified && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  <Award size={13} /> Sertifikasi Pendidik
                </p>
              )}

              {(profile.email || profile.phone) && (
                <div className="mt-5 space-y-2 border-t border-[#1B2A4A]/10 pt-5 text-left text-sm">
                  {profile.email && (
                    <a href={`mailto:${profile.email}`} className="flex items-center gap-2 text-[#23314D] hover:text-[#866D2C]"><Mail size={15} className="shrink-0 text-[#866D2C]" /> <span className="break-all">{profile.email}</span></a>
                  )}
                  {profile.phone && (
                    <a href={`tel:${profile.phone}`} className="flex items-center gap-2 text-[#23314D] hover:text-[#866D2C]"><Phone size={15} className="shrink-0 text-[#866D2C]" /> {profile.phone}</a>
                  )}
                </div>
              )}

              {socials.length > 0 && (
                <div className="mt-5 flex flex-wrap justify-center gap-2 border-t border-[#1B2A4A]/10 pt-5">
                  {socials.map(([key, value]) => {
                    const Icon = SOCIAL_ICONS[key] ?? Link2;
                    const href = String(value).startsWith('http') ? String(value) : `https://${String(value)}`;
                    return (
                      <a key={key} href={href} target="_blank" rel="noreferrer" title={SOCIAL_LABELS[key] ?? key}
                        className="grid h-10 w-10 place-items-center rounded-full bg-[#1B2A4A] text-white transition-colors hover:bg-[#866D2C]">
                        <Icon size={18} />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {profile.bio && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-3 flex items-center gap-2 font-bold text-[#1B2A4A]"><Compass size={18} className="text-[#866D2C]" /> Tentang</h2>
                <p className="whitespace-pre-wrap text-sm leading-7 text-[#23314D]">{profile.bio}</p>
              </div>
            )}

            {educations.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 font-bold text-[#1B2A4A]"><GraduationCap size={18} className="text-[#866D2C]" /> Pendidikan</h2>
                <ul className="space-y-3">
                  {educations.map((e, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#23314D]">
                      <GraduationCap size={15} className="mt-0.5 shrink-0 text-[#C8A951]" />
                      <span>
                        <strong>{e.jenjang}</strong>{e.jurusan ? ` - ${e.jurusan}` : ''} — {e.perguruan_tinggi}
                        {e.tahun_lulus ? ` (${e.tahun_lulus})` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {assignments.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 font-bold text-[#1B2A4A]"><Briefcase size={18} className="text-[#866D2C]" /> Tugas & Tanggung Jawab</h2>
                <ul className="space-y-2">
                  {assignments.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#23314D]">
                      <Briefcase size={15} className="mt-0.5 shrink-0 text-[#C8A951]" />
                      <span>
                        {a.uraian}
                        {a.jumlah_jam ? ` (${a.jumlah_jam} jam)` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-center">
              <Link to="/profil/direktori" className="inline-flex items-center gap-2 text-sm font-bold text-[#866D2C] hover:text-[#C8A951]"><ArrowLeft size={16} /> Kembali ke Direktori Profil</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
