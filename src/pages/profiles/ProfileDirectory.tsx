import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, Loader2, Search } from 'lucide-react';
import PageHero from '../../components/ui/PageHero';
import { publicProfileApi, resolveImageUrl, type PublicDirectory, type PublicDirectoryEntry } from '../../lib/api';

type Tab = 'guru' | 'osis';

const TABS: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: 'guru', label: 'Guru', icon: Users },
  { key: 'osis', label: 'Pengurus OSIS', icon: BookOpen },
];

const TAB_KEY: Record<Tab, 'gurus' | 'osis'> = { guru: 'gurus', osis: 'osis' };
const SLUG_PREFIX: Record<Tab, string> = { guru: 'guru', osis: 'osis' };

function ProfileDirectory() {
  const [directory, setDirectory] = useState<PublicDirectory | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('guru');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    publicProfileApi.directory().then(({ data }) => {
      if (!active) return;
      if (data) setDirectory(data);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const list: PublicDirectoryEntry[] = directory ? directory[TAB_KEY[tab]] : [];
  const q = search.toLowerCase();
  const filtered = useMemo(() => {
    const rows: PublicDirectoryEntry[] = directory ? directory[TAB_KEY[tab]] : [];
    return rows.filter((entry) => !q || entry.name.toLowerCase().includes(q) || (entry.position ?? '').toLowerCase().includes(q) || (entry.division ?? '').toLowerCase().includes(q) || (entry.major ?? '').toLowerCase().includes(q));
  }, [directory, tab, q]);

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Direktori Profil"
        subtitle="Profil publik Guru dan Pengurus OSIS SMKN 11 Kabupaten Tangerang"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Profil', href: '/profil/direktori' }]}
      />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${tab === t.key ? 'bg-[#1B2A4A] text-white' : 'bg-white border border-[#1B2A4A]/20 text-[#1B2A4A] hover:bg-[#FAF6F0]'}`}
                >
                  <Icon size={16} /> {t.label} <span className="text-xs opacity-70">({list.length})</span>
                </button>
              );
            })}
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#23314D]/50" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Cari ${TABS.find((t) => t.key === tab)?.label.toLowerCase()}...`} className="w-full rounded-lg border border-[#1B2A4A]/20 bg-white py-2 pl-10 pr-4 text-sm" />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center"><Loader2 className="mx-auto h-10 w-10 animate-spin text-[#C8A951]" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <Users className="mx-auto mb-3 h-10 w-10 text-[#C8A951]/40" />
            <p className="text-[#5B7088]">Belum ada {TABS.find((t) => t.key === tab)?.label.toLowerCase()} yang terdaftar.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((entry) => <EntryCard key={`${entry.role}-${entry.slug}`} entry={entry} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function EntryCard({ entry }: { entry: PublicDirectoryEntry }) {
  return (
    <Link
      to={`/profil/${SLUG_PREFIX[entry.role as Tab]}/${encodeURIComponent(entry.slug)}`}
      className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-[#FAF6F0]">
        {resolveImageUrl(entry.photo) ? (
                        <img src={resolveImageUrl(entry.photo)} alt={entry.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <Users className="h-7 w-7 text-[#C8A951]/60" />
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate font-bold text-[#1B2A4A] group-hover:text-[#866D2C]">{entry.name}</p>
        <p className="truncate text-sm text-[#5B7088]">
          {entry.role === 'guru' && [entry.position, entry.subject].filter(Boolean).join(' · ')}
          {entry.role === 'osis' && [entry.division, entry.position].filter(Boolean).join(' · ')}
        </p>
      </div>
    </Link>
  );
}

export default ProfileDirectory;
