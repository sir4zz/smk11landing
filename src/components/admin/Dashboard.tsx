import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, ArrowUpRight, BadgeCheck, BarChart3, BookOpen, Building2, CalendarDays,
  CheckCircle2, Clock, GraduationCap, Layers, Lightbulb, Mail, MapPin, MessageSquareText,
  Newspaper, Phone, School, Sparkles, Star, Trophy, UserCog,
} from 'lucide-react';
import logoSekolah from '../../assets/logo.png';
import { fetchStats, guruChangeRequestAdminApi, resolveImageUrl, studentChangeRequestAdminApi } from '../../lib/api';

type Item = Record<string, unknown>;

const TONES = {
  indigo: { chip: 'bg-[#EEF1FE] text-[#5B68D6]', bar: 'bg-[#5B68D6]', color: '#5B68D6', soft: 'bg-[#EEF1FE]', dot: 'bg-[#5B68D6]' },
  sky: { chip: 'bg-[#EAF2FB] text-[#3E86C7]', bar: 'bg-[#3E86C7]', color: '#3E86C7', soft: 'bg-[#EAF2FB]', dot: 'bg-[#3E86C7]' },
  sage: { chip: 'bg-[#E8F3ED] text-[#4F8A72]', bar: 'bg-[#4F8A72]', color: '#4F8A72', soft: 'bg-[#E8F3ED]', dot: 'bg-[#4F8A72]' },
  amber: { chip: 'bg-[#FBF1DC] text-[#C7902B]', bar: 'bg-[#C7902B]', color: '#C7902B', soft: 'bg-[#FBF1DC]', dot: 'bg-[#C7902B]' },
  lavender: { chip: 'bg-[#F1ECFB] text-[#8A6FC9]', bar: 'bg-[#8A6FC9]', color: '#8A6FC9', soft: 'bg-[#F1ECFB]', dot: 'bg-[#8A6FC9]' },
  rose: { chip: 'bg-[#FAECEA] text-[#C76A62]', bar: 'bg-[#C76A62]', color: '#C76A62', soft: 'bg-[#FAECEA]', dot: 'bg-[#C76A62]' },
  teal: { chip: 'bg-[#E6F2F1] text-[#3E8E89]', bar: 'bg-[#3E8E89]', color: '#3E8E89', soft: 'bg-[#E6F2F1]', dot: 'bg-[#3E8E89]' },
  slate: { chip: 'bg-[#EEF1F6] text-[#5C6B8A]', bar: 'bg-[#7B8BB0]', color: '#7B8BB0', soft: 'bg-[#EEF1F6]', dot: 'bg-[#7B8BB0]' },
} as const;
type Tone = (typeof TONES)[keyof typeof TONES];
type IconType = typeof Newspaper;

const CARD = 'rounded-2xl border border-[#E6EAF3] bg-white shadow-[0_1px_2px_rgba(23,32,64,0.05)]';
const CARD_PAD = 'p-5 md:p-6';

function str(value: unknown): string {
  return String(value ?? '').trim();
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function toDate(input: unknown): Date | null {
  const raw = str(input);
  if (!raw) return null;
  const d = new Date(raw.length <= 10 ? `${raw}T00:00:00` : raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function itemDate(item: Item): string {
  return str(item.created_at ?? item.updated_at ?? item.date);
}

function timeAgo(input: unknown): string {
  const d = toDate(input);
  if (!d) return '';
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'Baru saja';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(diff / 86_400_000);
  if (days < 30) return `${days} hari lalu`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} bulan lalu`;
  return `${Math.floor(months / 12)} tahun lalu`;
}

function formatDate(input: unknown): string {
  const d = toDate(input);
  if (!d) return '';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isRead(item: Item): boolean {
  const value = item.is_read ?? item.isRead;
  return value === true || value === 1 || value === '1';
}

function homeOf(data: Record<string, Item[]>): Record<string, unknown> {
  const recordRow = data.contentRecords?.find((r) => str(r.content_type) === 'home');
  if (!recordRow?.data) return {};
  if (typeof recordRow.data === 'object') return recordRow.data as Record<string, unknown>;
  try {
    return JSON.parse(String(recordRow.data)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function Fade({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function CardHeader({ icon: Icon, tone, title, subtitle, to }: { icon: IconType; tone: Tone; title: string; subtitle?: string; to?: string }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone.chip}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#2A3144]">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-[#8B94A8]">{subtitle}</p>}
        </div>
      </div>
      {to && (
        <Link to={to} className="mt-1 inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#5B68D6] transition-colors hover:text-[#4752C4]">
          Buka <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

export default function Dashboard({
  data, total, userName = 'Administrator', roleLabel = 'Administrator', isAdmin = false,
}: {
  data: Record<string, Item[]>;
  total: number;
  userName?: string;
  roleLabel?: string;
  isAdmin?: boolean;
}) {
  const [stats, setStats] = useState<{ value: string; label: string }[]>([]);
  const [verification, setVerification] = useState<{ students: number | null; gurus: number | null }>({ students: null, gurus: null });

  useEffect(() => {
    let cancelled = false;
    fetchStats()
      .then((rows) => { if (!cancelled) setStats(rows); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      const [sr, gr] = await Promise.allSettled([
        studentChangeRequestAdminApi.list({ status: 'menunggu' }),
        guruChangeRequestAdminApi.list({ status: 'menunggu' }),
      ]);
      if (cancelled) return;
      setVerification({
        students: sr.status === 'fulfilled' ? (sr.value.data?.length ?? 0) : null,
        gurus: gr.status === 'fulfilled' ? (gr.value.data?.length ?? 0) : null,
      });
    })();
    return () => { cancelled = true; };
  }, [isAdmin]);

  const derived = useMemo(() => ({
    news: data.news ?? [],
    programs: data.programs ?? [],
    facilities: data.facilities ?? [],
    staff: data.staff ?? [],
    gurus: data.gurus ?? [],
    achievements: data.achievements ?? [],
    teacherActivities: data.teacherActivities ?? [],
    educationStaff: data.educationStaff ?? [],
    contact: data.contact ?? [],
  }), [data]);
  const { news, programs, facilities, staff, gurus, achievements, teacherActivities, educationStaff, contact } = derived;
  const home = useMemo(() => homeOf(data), [data]);

  const newsCategories = useMemo(
    () => [...new Set(news.map((n) => str(n.category)).filter(Boolean))],
    [news],
  );
  const facilityCategories = useMemo(
    () => [...new Set(facilities.map((f) => str(f.category)).filter(Boolean))],
    [facilities],
  );
  const unreadContact = useMemo(() => contact.filter((m) => !isRead(m)).length, [contact]);

  const summary = [
    { label: 'Total Konten', value: total, icon: Layers, tone: TONES.indigo, hint: 'Gabungan seluruh konten' },
    { label: 'Berita', value: news.length, icon: Newspaper, tone: TONES.sky, hint: newsCategories.length ? `${newsCategories.length} kategori berita` : 'Belum ada berita' },
    { label: 'Program Keahlian', value: programs.length, icon: BookOpen, tone: TONES.sage, hint: programs.length ? 'Program unggulan sekolah' : 'Belum ada program' },
    { label: 'Fasilitas', value: facilities.length, icon: Building2, tone: TONES.amber, hint: facilityCategories.length ? `${facilityCategories.length} kategori fasilitas` : 'Belum ada fasilitas' },
  ];

  const chartRows = [
    { label: 'Berita', value: news.length, tone: TONES.indigo },
    { label: 'Program Keahlian', value: programs.length, tone: TONES.sky },
    { label: 'Fasilitas', value: facilities.length, tone: TONES.sage },
    { label: 'Prestasi', value: achievements.length, tone: TONES.amber },
    { label: 'Kegiatan Guru', value: teacherActivities.length, tone: TONES.lavender },
    { label: 'Staf', value: staff.length, tone: TONES.rose },
    { label: 'Guru', value: gurus.length, tone: TONES.teal },
    { label: 'Tenaga Kependidikan', value: educationStaff.length, tone: TONES.slate },
  ];
  const chartTotal = chartRows.reduce((sum, row) => sum + row.value, 0);

  const recent = useMemo(() => {
    const rows: { key: string; type: 'news' | 'activity' | 'achievement' | 'contact'; title: string; date: string }[] = [];
    news.forEach((n, index) => rows.push({ key: `news-${index}`, type: 'news', title: str(n.title), date: itemDate(n) }));
    teacherActivities.forEach((a, index) => rows.push({ key: `activity-${index}`, type: 'activity', title: str(a.title), date: itemDate(a) }));
    achievements.forEach((a, index) => rows.push({ key: `achievement-${index}`, type: 'achievement', title: str(a.title), date: itemDate(a) }));
    contact.forEach((m, index) => rows.push({ key: `contact-${index}`, type: 'contact', title: `${str(m.subject)} — ${str(m.name)}`, date: itemDate(m) }));
    return rows
      .filter((row) => row.title)
      .sort((a, b) => (toDate(b.date)?.getTime() ?? 0) - (toDate(a.date)?.getTime() ?? 0))
      .slice(0, 6);
  }, [news, teacherActivities, achievements, contact]);

  const TYPE_META: Record<string, { label: string; icon: IconType; tone: Tone }> = {
    news: { label: 'Berita', icon: Newspaper, tone: TONES.indigo },
    activity: { label: 'Kegiatan Guru', icon: CalendarDays, tone: TONES.lavender },
    achievement: { label: 'Prestasi', icon: Trophy, tone: TONES.amber },
    contact: { label: 'Pesan Kontak', icon: Mail, tone: TONES.rose },
  };

  const popularNews = useMemo(
    () => [...news].sort((a, b) => (toDate(itemDate(b))?.getTime() ?? 0) - (toDate(itemDate(a))?.getTime() ?? 0)).slice(0, 5),
    [news],
  );

  const reminders: { tone: Tone; icon: IconType; title: string; text: string }[] = [];
  if (unreadContact > 0) reminders.push({ tone: TONES.amber, icon: MessageSquareText, title: `${unreadContact} pesan kontak belum dibaca`, text: 'Tinjau dan tandai pesan masuk dari pengunjung website.' });
  if (news.length === 0) reminders.push({ tone: TONES.indigo, icon: Newspaper, title: 'Belum ada berita', text: 'Tambahkan berita agar beranda tetap informatif.' });
  if (programs.length === 0) reminders.push({ tone: TONES.sky, icon: BookOpen, title: 'Belum ada program keahlian', text: 'Lengkapi daftar program keahlian sekolah.' });
  if (facilities.length === 0) reminders.push({ tone: TONES.sage, icon: Building2, title: 'Belum ada fasilitas', text: 'Dokumentasikan fasilitas yang tersedia.' });
  if (achievements.length === 0) reminders.push({ tone: TONES.lavender, icon: Trophy, title: 'Belum ada prestasi', text: 'Catat prestasi siswa di menu Prestasi.' });

  const about = record(home.about);
  const contactInfo = record(home.contact);
  const welcome = record(home.welcome);
  const hero = record(home.hero);
  const schoolName = str(about.title) || 'SMKN 11 Kabupaten Tangerang';
  const principal = str(welcome.principal_name) || str(welcome.principalName);
  const accreditation = str(hero.accreditation);
  const schoolRows: { icon: IconType; tone: Tone; label: string; value: string }[] = [];
  if (principal) schoolRows.push({ icon: GraduationCap, tone: TONES.indigo, label: 'Kepala Sekolah', value: principal });
  if (str(contactInfo.address)) schoolRows.push({ icon: MapPin, tone: TONES.sky, label: 'Alamat', value: str(contactInfo.address) });
  if (str(contactInfo.phone)) schoolRows.push({ icon: Phone, tone: TONES.sage, label: 'Telepon / WhatsApp', value: str(contactInfo.phone) });
  if (str(contactInfo.email)) schoolRows.push({ icon: Mail, tone: TONES.amber, label: 'Email', value: str(contactInfo.email) });
  if (str(contactInfo.hours)) schoolRows.push({ icon: Clock, tone: TONES.lavender, label: 'Jam Operasional', value: str(contactInfo.hours) });

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  })();
  const todayLabel = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const verificationRows: { label: string; icon: IconType; tone: Tone; value: number | null; unit: string }[] = [
    { label: 'Verifikasi Data Siswa', icon: UserCog, tone: TONES.indigo, value: verification.students, unit: 'antrian' },
    { label: 'Pesan Kontak Belum Dibaca', icon: MessageSquareText, tone: TONES.amber, value: unreadContact, unit: 'pesan' },
    { label: 'Prestasi Tercatat', icon: Trophy, tone: TONES.sage, value: achievements.length, unit: 'prestasi' },
  ];

  return (
    <div className="space-y-6">
      <Fade>
        <section className="relative overflow-hidden rounded-2xl border border-[#E4E8F5] bg-gradient-to-br from-[#F1F4FE] via-white to-[#F6F1FC] p-6 shadow-[0_1px_2px_rgba(23,32,64,0.05)] md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#E5EAFD] blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 right-32 h-40 w-40 rounded-full bg-[#F0E9FB] blur-2xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#7C86E8] ring-1 ring-[#E1E6FA]">
                <Sparkles className="h-3.5 w-3.5" /> {todayLabel}
              </p>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#2A3144] md:text-3xl">
                {greeting}, {userName}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#5C6578]">
                Ringkasan aktivitas <span className="font-semibold text-[#3A4158]">{schoolName}</span>.
                Anda masuk sebagai <span className="font-semibold text-[#5B68D6]">{roleLabel}</span>.
              </p>
              {stats.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-3">
                  {stats.map((stat) => (
                    <span key={stat.label} className="inline-flex items-baseline gap-2 rounded-xl bg-white/80 px-3.5 py-2 text-sm ring-1 ring-[#E4E8F5]">
                      <span className="text-base font-bold text-[#2A3144]">{stat.value}</span>
                      <span className="text-[#6B7490]">{stat.label}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="hidden shrink-0 lg:block">
              <div className="grid h-24 w-24 place-items-center rounded-2xl bg-white/80 p-3 ring-1 ring-[#E4E8F5]">
                <img src={logoSekolah} alt="Logo SMKN 11" className="h-full w-full object-contain" />
              </div>
            </div>
          </div>
        </section>
      </Fade>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((card, index) => {
          const Icon = card.icon;
          return (
            <Fade key={card.label} delay={0.05 + index * 0.04}>
              <div className={`${CARD} ${CARD_PAD} transition-shadow hover:shadow-[0_6px_18px_rgba(23,32,64,0.08)]`}>
                <div className="flex items-start justify-between">
                  <div className={`grid h-11 w-11 place-items-center rounded-xl ${card.tone.chip}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-[#B3BACC]" />
                </div>
                <p className="mt-4 text-3xl font-bold tracking-tight text-[#2A3144]">{card.value}</p>
                <p className="mt-1 text-sm font-medium text-[#4A5268]">{card.label}</p>
                <p className="mt-1 text-xs text-[#9AA2B5]">{card.hint}</p>
              </div>
            </Fade>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Fade className="lg:col-span-2" delay={0.1}>
          <section className={`${CARD} ${CARD_PAD}`}>
            <CardHeader icon={BarChart3} tone={TONES.indigo} title="Statistik Konten" subtitle="Sebaran konten pada setiap bagian website" />
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
              <DonutChart rows={chartRows} total={chartTotal} />
              <ul className="w-full flex-1 gap-x-6 space-y-2.5 sm:grid sm:grid-cols-2 sm:gap-y-3 sm:space-y-0">
                {chartRows.map((row) => (
                  <li key={row.label} className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2 text-sm text-[#4A5268]">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.tone.color }} />
                      <span className="truncate">{row.label}</span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-[#2A3144]">{row.value}</span>
                  </li>
                ))}
              </ul>
            </div>
            {newsCategories.length > 0 && (
              <div className="mt-6 border-t border-[#EEF1F7] pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9AA2B5]">Kategori Berita</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {newsCategories.map((category) => {
                    const count = news.filter((n) => str(n.category) === category).length;
                    return (
                      <span key={category} className="rounded-full bg-[#EEF1FE] px-3 py-1 text-xs font-medium text-[#5B68D6]">
                        {category} <span className="font-bold">&middot; {count}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </Fade>

        <Fade delay={0.15}>
          <section className={`${CARD} ${CARD_PAD}`}>
            <CardHeader icon={BadgeCheck} tone={TONES.sage} title="Status Verifikasi" subtitle="Ringkasan hal yang perlu ditindaklanjuti" />
            <div className="space-y-4">
              {verificationRows.map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-center gap-3">
                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${row.tone.chip}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#4A5268]">{row.label}</p>
                      <p className="text-xs text-[#9AA2B5]">{row.value === null ? 'Belum dimuat' : `${row.value} ${row.unit}`}</p>
                    </div>
                    {row.value === null ? (
                      <span className="shrink-0 rounded-full bg-[#F1F3F8] px-2.5 py-1 text-[11px] font-semibold text-[#8B94A8]">-</span>
                    ) : row.value > 0 ? (
                      <span className="shrink-0 rounded-full bg-[#FBF1DC] px-2.5 py-1 text-[11px] font-semibold text-[#B07D1E]">Perlu perhatian</span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#E8F3ED] px-2.5 py-1 text-[11px] font-semibold text-[#3E7A5F]">
                        <CheckCircle2 className="h-3 w-3" /> Aman
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </Fade>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Fade delay={0.1}>
          <section className={`${CARD} ${CARD_PAD}`}>
            <CardHeader icon={Activity} tone={TONES.indigo} title="Aktivitas Terbaru" subtitle="Perubahan konten dan pesan terakhir" />
            {recent.length === 0 ? (
              <EmptyState icon={Activity} text="Belum ada aktivitas terbaru." />
            ) : (
              <ul className="space-y-1">
                {recent.map((row) => {
                  const meta = TYPE_META[row.type];
                  const Icon = meta.icon;
                  return (
                    <li key={row.key} className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-[#F7F8FC]">
                      <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${meta.tone.chip}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#3A4158]">{row.title}</p>
                        <p className="mt-0.5 text-xs text-[#9AA2B5]">
                          {meta.label} {row.date && <span className="text-[#B3BACC]">&middot; {timeAgo(row.date)}</span>}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </Fade>

        <Fade delay={0.15}>
          <section className={`${CARD} ${CARD_PAD}`}>
            <CardHeader icon={Star} tone={TONES.amber} title="Konten Populer" subtitle="Berita terbaru di website sekolah" to="/admin/berita" />
            {popularNews.length === 0 ? (
              <EmptyState icon={Star} text="Belum ada berita untuk ditampilkan." />
            ) : (
              <ul className="space-y-2">
                {popularNews.map((item) => {
                  const thumbnail = resolveImageUrl(str(item.thumbnail));
                  return (
                    <li key={str(item.id)} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[#F7F8FC]">
                      {thumbnail ? (
                        <img src={thumbnail} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="grid h-12 w-16 shrink-0 place-items-center rounded-lg bg-[#F1F3F8]">
                          <Newspaper className="h-5 w-5 text-[#B3BACC]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#3A4158]">{str(item.title)}</p>
                        <p className="mt-0.5 text-xs text-[#9AA2B5]">
                          {str(item.category) && <span className="font-semibold text-[#5B68D6]">{str(item.category)}</span>}
                          {str(item.date) && <span className="text-[#B3BACC]"> &middot; {formatDate(item.date)}</span>}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </Fade>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Fade delay={0.1}>
          <section className={`${CARD} ${CARD_PAD}`}>
            <CardHeader icon={Lightbulb} tone={TONES.sky} title="Pengingat & Informasi Penting" subtitle="Hal yang perlu diperhatikan pada website" />
            {reminders.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl bg-[#E8F3ED] px-4 py-3.5 text-sm text-[#3E7A5F]">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                Semua konten website terlihat rapi. Tidak ada hal yang perlu ditindaklanjuti.
              </div>
            ) : (
              <ul className="space-y-2.5">
                {reminders.map((reminder) => {
                  const Icon = reminder.icon;
                  return (
                    <li key={reminder.title} className={`flex items-start gap-3 rounded-xl ${reminder.tone.soft} px-4 py-3`}>
                      <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${reminder.tone.chip}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#3A4158]">{reminder.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-[#6B7490]">{reminder.text}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </Fade>

        <Fade delay={0.15}>
          <section className={`${CARD} ${CARD_PAD}`}>
            <CardHeader icon={School} tone={TONES.lavender} title="Informasi Sekolah" subtitle="Profil singkat dari konten beranda" to="/admin/konten-beranda" />
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-bold text-[#2A3144]">{schoolName}</p>
              {accreditation && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F1ECFB] px-2.5 py-1 text-[11px] font-semibold text-[#8A6FC9]">
                  <BadgeCheck className="h-3 w-3" /> {accreditation}
                </span>
              )}
            </div>
            {schoolRows.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {schoolRows.map((row) => {
                  const Icon = row.icon;
                  return (
                    <li key={row.label} className="flex items-start gap-3">
                      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${row.tone.chip}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#9AA2B5]">{row.label}</p>
                        <p className="mt-0.5 break-words text-sm text-[#3A4158]">{row.value}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-[#6B7490]">
                Profil sekolah belum dilengkapi. Isi kontak dan sambutan pada menu Konten Beranda agar informasi ini tampil.
              </p>
            )}
          </section>
        </Fade>
      </div>
    </div>
  );
}

function DonutChart({ rows, total }: { rows: { label: string; value: number; tone: Tone }[]; total: number }) {
  const size = 200;
  const stroke = 24;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;
  const segments = rows
    .filter((row) => row.value > 0)
    .map((row) => {
      const length = total > 0 ? (row.value / total) * circumference : 0;
      const segment = { ...row, length, offset: cumulative };
      cumulative += length;
      return segment;
    });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-48 w-48 shrink-0" role="img" aria-label="Diagram sebaran konten">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#EEF1F7" strokeWidth={stroke} />
      {segments.map((segment) => (
        <circle
          key={segment.label}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={segment.tone.color}
          strokeWidth={stroke}
          strokeDasharray={`${segment.length} ${circumference - segment.length}`}
          strokeDashoffset={-segment.offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      ))}
      <text x="50%" y="47%" textAnchor="middle" className="fill-[#2A3144] text-2xl font-bold">{total}</text>
      <text x="50%" y="60%" textAnchor="middle" className="fill-[#8B94A8] text-[10px] font-semibold uppercase tracking-wide">Total Konten</text>
    </svg>
  );
}

function EmptyState({ icon: Icon, text }: { icon: IconType; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-[#F7F8FC] px-4 py-8 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-[#E6EAF3]">
        <Icon className="h-5 w-5 text-[#B3BACC]" />
      </div>
      <p className="text-sm text-[#8B94A8]">{text}</p>
    </div>
  );
}
