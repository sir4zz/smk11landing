import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { Sparkles, Wand2, Scissors, BookOpen, Palette, Lightbulb, Loader2, X, RefreshCw, Check, PenLine } from 'lucide-react';
import { madingAiApi, MADING_AI_CONTENT_TYPES, MADING_AI_LENGTHS, MADING_AI_STYLES, type MadingAiDraft, type MadingAiIdea, type MadingAiLength } from '../../lib/api';

interface Category { id: string; name: string; slug?: string; }

interface Props {
  open: boolean;
  onClose: () => void;
  editorContent?: string;
  editorCategoryId?: string;
  categories?: Category[];
  onUseResult: (result: { title: string; content: string; category_id: string; excerpt?: string }) => void;
}

type Mode = 'form' | 'result' | 'ideas';

const LOADING_LABELS: Record<string, string> = {
  generate: '✨ AI sedang membuat draft...',
  improve: '🪄 AI sedang memperbaiki tulisan...',
  shorten: '✂️ AI sedang meringkas tulisan...',
  expand: '📖 AI sedang mengembangkan tulisan...',
  changeStyle: '🎨 AI sedang mengubah gaya penulisan...',
  generateIdeas: '💡 AI sedang mencari ide...',
};

function categoryIdForName(categories: Category[], name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  const found = categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase()) ?? categories.find((c) => c.slug?.toLowerCase() === trimmed.toLowerCase());
  return found?.id ?? '';
}

export default function AIContentAssistant({ open, onClose, editorContent = '', editorCategoryId = '', categories = [], onUseResult }: Props) {
  const [mode, setMode] = useState<Mode>('form');
  const [contentType, setContentType] = useState('');
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('');
  const [length, setLength] = useState<MadingAiLength>('Sedang');
  const [context, setContext] = useState('');
  const [activeAction, setActiveAction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastAction, setLastAction] = useState('');
  const [lastInput, setLastInput] = useState<Record<string, unknown> | null>(null);
  const [result, setResult] = useState<MadingAiDraft | null>(null);
  const [resultValues, setResultValues] = useState({ title: '', content: '', category: '' });
  const [ideas, setIdeas] = useState<MadingAiIdea[]>([]);
  const [ideaTopic, setIdeaTopic] = useState('');
  const [ideaTarget, setIdeaTarget] = useState('siswa SMK');

  const initialContentRef = useRef(editorContent);

  useEffect(() => {
    if (open) {
      initialContentRef.current = editorContent;
      setError('');
      setLoading(false);
      setResult(null);
      setIdeas([]);
      if (!contentType) setContentType(MADING_AI_CONTENT_TYPES[0]);
      if (!style) setStyle(MADING_AI_STYLES[1]);
      setMode('form');
    }
  }, [open, editorContent, contentType, style]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const flashError = useCallback((message: string) => {
    setError(message || 'AI tidak dapat memproses permintaan saat ini. Silakan coba lagi.');
    setLoading(false);
  }, []);

  const run = useCallback(async (action: string, input: Record<string, unknown>) => {
    setActiveAction(action);
    setLoading(true);
    setError('');
    setLastAction(action);
    setLastInput(input);
    let res;
    switch (action) {
      case 'generate':
        res = await madingAiApi.generate(input as never);
        break;
      case 'improve':
        res = await madingAiApi.improve(input as never);
        break;
      case 'shorten':
        res = await madingAiApi.shorten(input as never);
        break;
      case 'expand':
        res = await madingAiApi.expand(input as never);
        break;
      case 'changeStyle':
        res = await madingAiApi.changeStyle(input as never);
        break;
      case 'generateIdeas':
        res = await madingAiApi.generateIdeas(input as never);
        break;
      default:
        res = { data: null, error: { message: 'Aksi tidak dikenal.' } };
    }
    setLoading(false);
    setActiveAction('');
    if (res.error) {
      const msg = (res.error as { message?: string })?.message ?? res.error;
      flashError(typeof msg === 'string' ? msg : 'AI tidak dapat memproses permintaan saat ini. Silakan coba lagi.');
      return;
    }
    if (action === 'generateIdeas') {
      const list = (res.data as { ideas?: MadingAiIdea[] } | null)?.ideas ?? [];
      setIdeas(list);
      setMode('ideas');
      return;
    }
    const draft = res.data as MadingAiDraft | null;
    if (draft) {
      setResult(draft);
      setResultValues({ title: draft.title, content: draft.content, category: draft.category });
      setMode('result');
    } else {
      flashError('AI tidak dapat memproses permintaan saat ini. Silakan coba lagi.');
    }
  }, [flashError]);

  const handleGenerate = () => {
    const t = topic.trim();
    if (!t) { setError('Topik wajib diisi.'); return; }
    if (!contentType) { setError('Pilih jenis konten.'); return; }
    void run('generate', { content_type: contentType, topic: t, style, length, context: context.trim() });
  };

  const handleIdeas = () => {
    const t = ideaTopic.trim();
    if (!t) { setError('Topik ide wajib diisi.'); return; }
    void run('generateIdeas', { topic: t, target: ideaTarget.trim() || 'siswa SMK' });
  };

  const applyIdea = (idea: MadingAiIdea) => {
    setTopic(idea.title);
    const matched = MADING_AI_CONTENT_TYPES.find((c) => c.toLowerCase() === (idea.category || '').toLowerCase());
    if (matched) setContentType(matched);
    setMode('form');
  };

  const applyResult = () => {
    if (!resultValues.title.trim() || !resultValues.content.trim()) {
      setError('Judul dan isi hasil AI wajib diisi.');
      return;
    }
    onUseResult({
      title: resultValues.title.trim(),
      content: resultValues.content.trim(),
      category_id: categoryIdForName(categories, resultValues.category) || editorCategoryId,
      excerpt: result?.excerpt,
    });
    onClose();
  };

  const retry = () => {
    if (loading) return;
    if (lastAction && lastInput) {
      void run(lastAction, lastInput);
    }
  };

  const actionFromContent = (action: string, opts?: { style?: string }) => {
    const content = resultValues.content.trim() || initialContentRef.current.trim();
    if (!content) {
      setError('Tidak ada isi yang dapat diproses. Generate dulu atau isi editor terlebih dahulu.');
      return;
    }
    const base = { content, content_type: resultValues.category || contentType };
    if (action === 'changeStyle') {
      const s = opts?.style || style;
      void run('changeStyle', { ...base, style: s });
    } else {
      void run(action, base);
    }
  };

  const regenerate = () => {
    if (lastInput && lastInput.content_type) {
      void run('generate', lastInput);
    } else {
      handleGenerate();
    }
  };

  if (!open) return null;

  const hasEditorContent = Boolean((resultValues.content || initialContentRef.current).trim());
  const f = (key: 'title' | 'content' | 'category') => ({
    value: resultValues[key],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setResultValues((v) => ({ ...v, [key]: e.target.value })),
  });

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 p-3 py-6 sm:p-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1B2A4A]/10 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#1B2A4A]">
            <Sparkles className="h-5 w-5 text-[#C8A951]" /> AI Content Assistant
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[#5B7088] hover:bg-[#FAF6F0]"><X className="h-5 w-5" /></button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-5">
          <p className="mb-4 text-sm text-[#5B7088]">
            Asisten penulisan Mading <strong>SMKN 11 Kabupaten Tangerang</strong>. AI membantu membuat draft yang masih bisa kamu edit — bukan menggantikan penulis, dan tidak pernah mempublikasikan karya.
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <p>{error}</p>
              <button
                onClick={() => { setError(''); void retry(); }}
                className="mt-2 inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Coba Lagi
              </button>
            </div>
          )}

          {loading && (
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#FAF6F0] p-4 text-sm font-semibold text-[#1B2A4A]">
              <Loader2 className="h-5 w-5 animate-spin text-[#C8A951]" />
              {LOADING_LABELS[activeAction] ?? '✨ AI sedang bekerja...'}
            </div>
          )}

          {mode === 'form' && (
            <div className="space-y-4">
              {hasEditorContent && (
                <div className="rounded-xl border border-[#C8A951]/40 bg-[#FFF9E8] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#866D2C]">Isi saat ini dari editor</p>
                  <p className="mt-1 line-clamp-3 text-sm text-[#23314D]">{resultValues.content || initialContentRef.current}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-[#1B2A4A]">Jenis Konten
                  <select value={contentType} onChange={(e) => setContentType(e.target.value)} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal">
                    <option value="">Pilih Jenis Konten</option>
                    {MADING_AI_CONTENT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-[#1B2A4A]">Gaya Bahasa
                  <select value={style} onChange={(e) => setStyle(e.target.value)} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal">
                    {MADING_AI_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-[#1B2A4A]">Panjang
                  <select value={length} onChange={(e) => setLength(e.target.value as MadingAiLength)} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal">
                    {MADING_AI_LENGTHS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-[#1B2A4A]">Topik
                  <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="cth. Persahabatan di Sekolah" className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" />
                </label>
              </div>
              <label className="block text-sm font-semibold text-[#1B2A4A]">Konteks tambahan (opsional)
                <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={3} placeholder="Tambahkan detail, kata kunci, atau arahan khusus..." className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" />
              </label>

              <div className="flex flex-wrap gap-2">
                <button onClick={handleGenerate} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-4 py-2 text-sm font-bold text-white hover:bg-[#15203a] disabled:opacity-60">
                  {loading && activeAction === 'generate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-[#C8A951]" />} Generate
                </button>
                {hasEditorContent && (
                  <>
                    <ActionButton icon={Wand2} label="Improve" disabled={loading} onClick={() => actionFromContent('improve')} />
                    <ActionButton icon={Scissors} label="Shorten" disabled={loading} onClick={() => actionFromContent('shorten')} />
                    <ActionButton icon={BookOpen} label="Expand" disabled={loading} onClick={() => actionFromContent('expand')} />
                    <ActionButton icon={Palette} label="Change Style" disabled={loading} onClick={() => actionFromContent('changeStyle')} />
                  </>
                )}
                <button onClick={() => setMode('ideas')} className="inline-flex items-center gap-2 rounded-lg border border-[#1B2A4A]/20 px-4 py-2 text-sm font-bold text-[#1B2A4A] hover:bg-[#FAF6F0]">
                  <Lightbulb className="h-4 w-4 text-[#C8A951]" /> Generate Ideas
                </button>
              </div>
            </div>
          )}

          {mode === 'ideas' && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-[#1B2A4A]">Topik
                  <input value={ideaTopic} onChange={(e) => setIdeaTopic(e.target.value)} placeholder="cth. Teknologi" className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" />
                </label>
                <label className="block text-sm font-semibold text-[#1B2A4A]">Target Pembaca
                  <input value={ideaTarget} onChange={(e) => setIdeaTarget(e.target.value)} placeholder="siswa SMK" className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal" />
                </label>
              </div>
              <button onClick={handleIdeas} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-4 py-2 text-sm font-bold text-white hover:bg-[#15203a] disabled:opacity-60">
                {loading && activeAction === 'generateIdeas' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4 text-[#C8A951]" />} Generate Ideas
              </button>

              {ideas.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-bold text-[#1B2A4A]">Ide Konten</p>
                  {ideas.map((idea, i) => (
                    <div key={i} className="rounded-xl border border-[#1B2A4A]/10 bg-[#FAF6F0] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-[#1B2A4A]">{i + 1}. {idea.title || '-'}</p>
                          <p className="mt-1 text-sm text-[#5B7088]">{idea.category && <span className="mr-2 inline-block rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[#866D2C]">{idea.category}</span>}{idea.description}</p>
                        </div>
                        <button onClick={() => applyIdea(idea)} className="shrink-0 rounded-lg bg-[#C8A951] px-3 py-1.5 text-xs font-bold text-[#1B2A4A] hover:bg-[#B69740]">Gunakan Ide Ini</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === 'result' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1 text-sm font-bold text-[#1B2A4A]"><Sparkles className="h-4 w-4 text-[#C8A951]" /> AI Generated Draft</p>
                <button onClick={regenerate} disabled={loading} className="inline-flex items-center gap-1 rounded-lg border border-[#1B2A4A]/20 px-3 py-1.5 text-xs font-bold text-[#1B2A4A] hover:bg-[#FAF6F0] disabled:opacity-60">
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </button>
              </div>

              <div className="rounded-xl bg-[#FAF6F0] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#866D2C]">Judul</p>
                <input {...f('title')} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-2 font-semibold text-[#1B2A4A]" />
              </div>

              <div className="rounded-xl bg-[#FAF6F0] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#866D2C]">Isi</p>
                <textarea {...f('content')} rows={12} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-2 font-normal leading-relaxed" />
              </div>

              <div className="rounded-xl bg-[#FAF6F0] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#866D2C]">Kategori</p>
                <select {...f('category')} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-2 font-normal">
                  <option value="">Pilih Kategori</option>
                  {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button onClick={applyResult} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-4 py-2 text-sm font-bold text-white hover:bg-[#15203a] disabled:opacity-60">
                  <Check className="h-4 w-4 text-[#C8A951]" /> Gunakan Hasil
                </button>
                <ActionButton icon={Wand2} label="Improve" disabled={loading} onClick={() => actionFromContent('improve')} />
                <ActionButton icon={Scissors} label="Shorten" disabled={loading} onClick={() => actionFromContent('shorten')} />
                <ActionButton icon={BookOpen} label="Expand" disabled={loading} onClick={() => actionFromContent('expand')} />
                <ActionButton icon={Palette} label="Change Style" disabled={loading} onClick={() => actionFromContent('changeStyle')} />
              </div>
            </div>
          )}
        </div>

        <div className="rounded-b-2xl border-t border-[#1B2A4A]/10 bg-[#FAF6F0] px-5 py-3 text-xs text-[#5B7088]">
          <PenLine className="mr-1 inline h-3.5 w-3.5 text-[#C8A951]" />
          Hasil AI tetap melewati review Guru/Admin sebelum dipublikasikan. AI tidak mengarang fakta sekolah.
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, disabled, onClick }: { icon: typeof Wand2; label: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled} className="inline-flex items-center gap-2 rounded-lg border border-[#1B2A4A]/20 px-4 py-2 text-sm font-bold text-[#1B2A4A] hover:bg-[#FAF6F0] disabled:opacity-60">
      <Icon className="h-4 w-4 text-[#C8A951]" /> {label}
    </button>
  );
}

export function AiNote({ children }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#C8A951]/15 px-2.5 py-1 text-[11px] font-semibold text-[#866D2C]">
      <Sparkles className="h-3 w-3" /> {children ?? 'Dibuat dengan bantuan AI'}
    </span>
  );
}
