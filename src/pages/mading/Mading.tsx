import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../../components/ui/PageHero';
import SectionHeading from '../../components/ui/SectionHeading';
import { LoadingInline } from '../../components/ui/LoadingScreen';
import { fetchMadingPublished, fetchMadingCategories, resolveImageUrl, type MadingPostRow } from '../../lib/api';
import type { MadingCategory, MadingPost } from '../../lib/content-types';
import { PenLine, Calendar, User, ChevronRight } from 'lucide-react';
import { AiNote } from '../../components/mading/AIContentAssistant';

type Post = MadingPostRow & { category?: string };

function normalizeCategory(row: MadingPostRow, categories: MadingCategory[]): string {
  const rel = row['mading_categories'] as { name?: string } | null | undefined;
  if (rel?.name) return rel.name;
  const cat = categories.find((c) => String(c.id) === String(row.category_id));
  return cat?.name ?? 'Lainnya';
}

const Mading: React.FC = () => {
  const [posts, setPosts] = useState<MadingPost[]>([]);
  const [categories, setCategories] = useState<MadingCategory[]>([]);
  const [filter, setFilter] = useState('Semua');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([fetchMadingPublished(), fetchMadingCategories<MadingCategory[]>()]).then(([rows, cats]) => {
      if (!active) return;
      setCategories(cats);
      const data: Post[] = rows.map((r) => ({ ...r, category: normalizeCategory(r, cats) }));
       setPosts(data as MadingPost[]);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const catNames = ['Semua', ...categories.map((c) => c.name)];
  const filtered = filter === 'Semua' ? posts : posts.filter((p) => p.category === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="Mading" subtitle="Media Aspirasi Digital SMKN 11 Kabupaten Tangerang" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Mading' }]} />
        <div className="py-24"><LoadingInline /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Mading SMKN 11 Kabupaten Tangerang"
        subtitle="Tempat publikasi karya, aspirasi, dan informasi siswa & guru"
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Mading' }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <SectionHeading title="Karya Terpublikasi" subtitle="Puisi, cerpen, artikel, dan karya kreatif lainnya" align="left" />
          <a href="/mading/login" className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2.5 font-bold text-white hover:bg-[#15203a]">
            <PenLine className="h-4 w-4" /> Area Siswa
          </a>
        </div>

        <div className="mb-12 flex flex-wrap justify-center gap-3">
          {catNames.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`rounded-full px-5 py-2 font-medium transition-all ${filter === c ? 'bg-[#1B2A4A] text-[#FAF6F0]' : 'border border-[#1B2A4A]/20 bg-white text-[#1B2A4A] hover:bg-[#FAF6F0]'}`}
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <PenLine className="mx-auto h-12 w-12 text-[#C8A951]/40" />
            <p className="mt-4 text-lg font-medium text-[#23314D]">Belum ada karya yang dipublikasikan</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post) => {
              const thumb = resolveImageUrl(post.cover_image) ?? resolveImageUrl((Array.isArray(post.images) ? post.images : [])[0]);
              return (
              <Link
                key={post.id ?? post.title}
                to={`/mading/${post.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#1B2A4A]/10 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                {thumb && (
                  <div className="h-40 overflow-hidden">
                    <img src={thumb} alt={post.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <span className="mb-3 inline-block w-fit rounded-full bg-[#FAF6F0] px-3 py-1 text-xs font-semibold text-[#866D2C]">{post.category}</span>
                  <h3 className="text-lg font-bold text-[#1B2A4A] line-clamp-2 transition-colors group-hover:text-[#C8A951]">{post.title}</h3>
                  {post.ai_assisted && <div className="mt-1.5"><AiNote /></div>}
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#23314D]">{post.content}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-[#5B7088]">
                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5 text-[#C8A951]" /> {post.author_name || 'Anonim'}</span>
                    {post.published_at && (
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-[#C8A951]" /> {new Date(post.published_at).toLocaleDateString('id-ID')}</span>
                    )}
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#1B2A4A] transition-colors group-hover:text-[#C8A951]">
                    Selengkapnya <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Mading;
