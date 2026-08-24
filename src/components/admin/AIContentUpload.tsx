import { useCallback, useRef, useState } from 'react';
import {
  Sparkles, Upload, X, Loader2, CheckCircle2, AlertCircle,
  Image as ImageIcon, ChevronRight, Save, Send,
  Calendar, MapPin, Tag, FileText, RotateCcw,
  Info, Wand2, Zap, ArrowRight,
} from 'lucide-react';
import {
  backendApi, resolveImageUrl,
  aiContentUploadApi,
  AI_CONTENT_TYPE_LABELS,
  type AIContentType, type AIAnalysisResult, type AISingleImageResult,
} from '../../lib/api';

type Step = 'upload' | 'analyzing' | 'review' | 'saving' | 'done';

interface ImageItem {
  id: string;
  file: File;
  preview: string;
  url?: string;
}

interface ImageForm {
  imageUrl: string;
  result: AIAnalysisResult | null;
  form: Partial<AIAnalysisResult>;
  saved: boolean;
  saving: boolean;
  error: string;
}

const AI_ANALYSIS_MESSAGES = [
  '✨ AI sedang menganalisis foto...',
  'Mendeteksi kegiatan...',
  'Membaca teks pada gambar...',
  'Menyusun judul dan deskripsi...',
  'Menyiapkan data konten...',
  'Mengidentifikasi kategori...',
];

const MAX_IMAGES = 3;

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export default function AIContentUpload() {
  const [step, setStep] = useState<Step>('upload');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [contentType, setContentType] = useState<AIContentType>('auto');
  const [imageForms, setImageForms] = useState<ImageForm[]>([]);
  const [analysisMessage, setAnalysisMessage] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback((files: FileList | File[]) => {
    const validFiles: File[] = [];
    let msg = '';
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 20 * 1024 * 1024) {
        msg = `File "${file.name}" terlalu besar (maks 20MB).`;
        continue;
      }
      validFiles.push(file);
    }
    if (msg) setError(msg);

    setImages(prev => {
      const space = MAX_IMAGES - prev.length;
      if (space <= 0) {
        setError(`Maksimal ${MAX_IMAGES} foto.`);
        return prev;
      }
      const toAdd = validFiles.slice(0, space);
      if (validFiles.length > space) {
        setError(`Hanya ${space} foto lagi yang bisa ditambahkan (maks ${MAX_IMAGES}).`);
      }
      return [...prev, ...toAdd.map(f => ({
        id: generateId(),
        file: f,
        preview: URL.createObjectURL(f),
      }))];
    });
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.id !== id);
    });
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current++; setDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current--; if (dragCounter.current === 0) setDragging(false); }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragging(false); dragCounter.current = 0; if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }, [addFiles]);

  // --- Analyze ---
  const handleAnalyze = async () => {
    if (images.length === 0) { setError('Pilih minimal satu foto.'); return; }

    setStep('analyzing');
    setError('');
    setAnalysisMessage(0);

    const msgInterval = setInterval(() => {
      setAnalysisMessage(prev => (prev + 1) % AI_ANALYSIS_MESSAGES.length);
    }, 2500);

    try {
      // Upload all images
      const uploadedUrls: string[] = [];
      for (const img of images) {
        const { data, error: uploadError } = await backendApi.storage.from('photos').uploadAuto(img.file);
        if (uploadError || !data?.url) throw new Error(`Gagal mengunggah "${img.file.name}".`);
        uploadedUrls.push(data.url);
      }
      setImages(prev => prev.map((img, i) => ({ ...img, url: uploadedUrls[i] })));

      // Analyze each image separately
      const { data: results, error: aiError } = await aiContentUploadApi.analyze(uploadedUrls, contentType);
      if (aiError || !results) throw new Error(aiError?.message ?? 'AI gagal menganalisis foto.');

      const forms: ImageForm[] = results.map((r: AISingleImageResult) => ({
        imageUrl: r.image_url,
        result: r.success ? r.data : null,
        form: r.success && r.data ? {
          title: r.data.title,
          description: r.data.description,
          category: r.data.category,
          content_type: r.data.content_type,
          date: r.data.date,
          location: r.data.location,
          tags: r.data.tags,
          caption: r.data.caption,
          summary: r.data.summary,
          additional_info: r.data.additional_info,
        } : { title: '', content_type: contentType === 'auto' ? 'lainnya' : contentType },
        saved: false,
        saving: false,
        error: r.success ? '' : (r.error ?? 'Gagal menganalisis'),
      }));

      setImageForms(forms);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menganalisis foto.');
      setStep('upload');
    } finally {
      clearInterval(msgInterval);
    }
  };

  // --- Update form for a specific image ---
  const updateForm = (index: number, patch: Partial<AIAnalysisResult>) => {
    setImageForms(prev => prev.map((f, i) => i === index ? { ...f, form: { ...f.form, ...patch } } : f));
  };

  // --- Save one image's content ---
  const handleSaveOne = async (index: number, status: 'draft' | 'published') => {
    const item = imageForms[index];
    if (!item.form.title?.trim()) { setError(`Judul foto #${index + 1} wajib diisi.`); return; }

    setImageForms(prev => prev.map((f, i) => i === index ? { ...f, saving: true, error: '' } : f));
    setError('');

    try {
      const { data: result, error: saveError } = await aiContentUploadApi.save({
        content_type: (item.form.content_type as AIContentType) ?? contentType,
        image_urls: [item.imageUrl],
        title: item.form.title!,
        description: item.form.description ?? '',
        category: item.form.category ?? '',
        date: item.form.date ?? undefined,
        location: item.form.location ?? undefined,
        tags: item.form.tags ?? [],
        caption: item.form.caption ?? '',
        summary: item.form.summary ?? '',
        status,
      });

      if (saveError || !result) throw new Error(saveError?.message ?? 'Gagal menyimpan.');

      setImageForms(prev => prev.map((f, i) => i === index ? { ...f, saved: true, saving: false } : f));
    } catch (err) {
      setImageForms(prev => prev.map((f, i) => i === index ? { ...f, saving: false, error: err instanceof Error ? err.message : 'Gagal menyimpan' } : f));
    }
  };

  const handleReset = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setContentType('auto');
    setImageForms([]);
    setError('');
    setDoneCount(0);
    setStep('upload');
  };

  // --- Confidence Badge ---
  const ConfidenceBadge = ({ level }: { level?: string }) => {
    if (!level) return null;
    const colors: Record<string, string> = { high: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-red-100 text-red-700' };
    const labels: Record<string, string> = { high: 'Yakin', medium: 'Cukup yakin', low: 'Perlu konfirmasi' };
    return (
      <span className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors[level] ?? colors.medium}`}>
        <Zap size={10} /> {labels[level] ?? level}
      </span>
    );
  };

  // --- Single Image Form Card ---
  const ImageFormCard = ({ index, item }: { index: number; item: ImageForm }) => {
    const img = images.find(i => i.url === item.imageUrl);
    return (
      <div className={`rounded-xl border bg-white p-5 shadow-sm ${item.saved ? 'border-green-300 bg-green-50/30' : 'border-[#1B2A4A]/10'}`}>
        {/* Header with image */}
        <div className="mb-4 flex items-start gap-4">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-[#1B2A4A]/10">
            <img
              src={img?.url ? resolveImageUrl(img.url) ?? img.preview : img?.preview ?? ''}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#1B2A4A]">Foto #{index + 1}</span>
              {item.saved && <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">Tersimpan</span>}
              {!item.result && !item.saved && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">Gagal analisis</span>}
            </div>
            {item.error && <p className="mt-1 text-xs text-red-500">{item.error}</p>}
          </div>
        </div>

        {item.saved ? (
          <div className="flex items-center gap-2 rounded-lg bg-green-100 p-3 text-sm text-green-700">
            <CheckCircle2 size={16} /> Konten berhasil disimpan!
          </div>
        ) : (
          <div className="space-y-3">
            {/* Title */}
            <div>
              <label className="mb-1 flex items-center text-xs font-semibold text-[#1B2A4A]">
                Judul <ConfidenceBadge level={item.result?.confidence?.title} />
              </label>
              <input
                type="text"
                value={item.form.title ?? ''}
                onChange={e => updateForm(index, { title: e.target.value })}
                className="w-full rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-2 text-sm"
                placeholder="Judul konten..."
              />
            </div>

            {/* Content Type */}
            <div>
              <label className="mb-1 flex items-center text-xs font-semibold text-[#1B2A4A]">
                Jenis Konten <ConfidenceBadge level={item.result?.confidence?.content_type} />
              </label>
              <select
                value={item.form.content_type ?? 'lainnya'}
                onChange={e => updateForm(index, { content_type: e.target.value as AIContentType })}
                className="w-full rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-2 text-sm"
              >
                {Object.entries(AI_CONTENT_TYPE_LABELS).filter(([k]) => k !== 'auto').map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="mb-1 flex items-center text-xs font-semibold text-[#1B2A4A]">
                Kategori <ConfidenceBadge level={item.result?.confidence?.category} />
              </label>
              <input
                type="text"
                value={item.form.category ?? ''}
                onChange={e => updateForm(index, { category: e.target.value })}
                className="w-full rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-2 text-sm"
                placeholder="Kategori..."
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 flex items-center text-xs font-semibold text-[#1B2A4A]">
                Deskripsi <ConfidenceBadge level={item.result?.confidence?.description} />
              </label>
              <textarea
                value={item.form.description ?? ''}
                onChange={e => updateForm(index, { description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-2 text-sm"
                placeholder="Deskripsi konten..."
              />
            </div>

            {/* Date & Location */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-[#1B2A4A]">
                  <Calendar size={12} /> Tanggal
                </label>
                <input type="date" value={item.form.date ?? ''} onChange={e => updateForm(index, { date: e.target.value || null })} className="w-full rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-[#1B2A4A]">
                  <MapPin size={12} /> Lokasi
                </label>
                <input type="text" value={item.form.location ?? ''} onChange={e => updateForm(index, { location: e.target.value || null })} className="w-full rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-2 text-sm" placeholder="Lokasi..." />
              </div>
            </div>

            {/* Caption & Tags */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 text-xs font-semibold text-[#1B2A4A]">Caption</label>
                <input type="text" value={item.form.caption ?? ''} onChange={e => updateForm(index, { caption: e.target.value })} className="w-full rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-2 text-sm" placeholder="Caption..." />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-[#1B2A4A]">
                  <Tag size={12} /> Tags
                </label>
                <input type="text" value={(item.form.tags ?? []).join(', ')} onChange={e => updateForm(index, { tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} className="w-full rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-2 text-sm" placeholder="tag1, tag2..." />
              </div>
            </div>

            {/* Additional Info */}
            {item.form.additional_info && (
              <div className="rounded-lg bg-[#FAF6F0] p-2">
                <label className="flex items-center gap-1 text-[10px] font-semibold text-[#5B7088]"><Info size={10} /> Info Tambahan</label>
                <p className="text-xs text-[#23314D]">{item.form.additional_info}</p>
              </div>
            )}

            {/* Save buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleSaveOne(index, 'draft')}
                disabled={item.saving || !item.form.title?.trim()}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-[#1B2A4A] px-3 py-2 text-xs font-bold text-[#1B2A4A] hover:bg-[#1B2A4A]/5 disabled:opacity-40"
              >
                {item.saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Draft
              </button>
              <button
                onClick={() => handleSaveOne(index, 'published')}
                disabled={item.saving || !item.form.title?.trim()}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#C8A951] px-3 py-2 text-xs font-bold text-[#1B2A4A] hover:bg-[#b69740] disabled:opacity-40"
              >
                {item.saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Publish
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ===================== RENDER =====================
  const allSaved = imageForms.length > 0 && imageForms.every(f => f.saved);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#C8A951] to-[#866D2C] text-white shadow-lg">
          <Wand2 size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1B2A4A]">Upload dengan AI</h2>
          <p className="text-sm text-[#5B7088]">Maks {MAX_IMAGES} foto — tiap foto dianalisis terpisah</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={18} />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700"><X size={16} /></button>
        </div>
      )}

      {/* Step Indicator */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        {(['upload', 'analyzing', 'review', 'done'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full font-bold ${
              step === s ? 'bg-[#C8A951] text-[#1B2A4A]' :
              (['upload', 'analyzing', 'review', 'done'].indexOf(step)) > i
                ? 'bg-[#1B2A4A] text-white' : 'bg-[#1B2A4A]/10 text-[#5B7088]'
            }`}>
              {(['upload', 'analyzing', 'review', 'done'].indexOf(step)) > i ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            <span className={`hidden sm:inline ${step === s ? 'font-semibold text-[#1B2A4A]' : 'text-[#5B7088]'}`}>
              {s === 'upload' ? 'Upload' : s === 'analyzing' ? 'Analisis' : s === 'review' ? 'Review' : 'Selesai'}
            </span>
            {i < 3 && <ChevronRight size={14} className="text-[#5B7088]/40" />}
          </div>
        ))}
      </div>

      {/* ===== UPLOAD ===== */}
      {step === 'upload' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-[#1B2A4A]/10 bg-white p-5 shadow-sm">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1B2A4A]">
              <FileText size={16} /> Jenis Konten
            </label>
            <select value={contentType} onChange={e => setContentType(e.target.value as AIContentType)} className="w-full rounded-lg border border-[#1B2A4A]/20 bg-white px-3 py-2.5 text-sm">
              {(Object.entries(AI_CONTENT_TYPE_LABELS) as [AIContentType, string][]).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div
            onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${dragging ? 'border-[#C8A951] bg-[#C8A951]/10 scale-[1.01]' : 'border-[#1B2A4A]/20 bg-white hover:border-[#C8A951]/50 hover:bg-[#FAF6F0]'}`}
          >
            <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ''; }} />
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[#FAF6F0]">
              <Upload size={28} className={dragging ? 'text-[#C8A951]' : 'text-[#5B7088]'} />
            </div>
            <p className="text-sm font-semibold text-[#1B2A4A]">{dragging ? 'Lepaskan foto...' : 'Seret & lepas foto'}</p>
            <p className="mt-1 text-xs text-[#5B7088]">Maks {MAX_IMAGES} foto, 20MB per foto</p>
          </div>

          {images.length > 0 && (
            <div className="rounded-xl border border-[#1B2A4A]/10 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#1B2A4A]">
                  <ImageIcon size={16} className="mr-1 inline" /> {images.length}/{MAX_IMAGES} foto
                </span>
                <button onClick={() => { images.forEach(i => URL.revokeObjectURL(i.preview)); setImages([]); }} className="text-xs text-red-500 hover:text-red-700">Hapus semua</button>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {images.map(img => (
                  <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-[#1B2A4A]/10">
                    <img src={img.preview} alt="" className="h-full w-full object-cover" />
                    <button onClick={() => removeImage(img.id)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {images.length > 0 && (
            <button onClick={handleAnalyze} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1B2A4A] to-[#2a3f6a] px-6 py-3.5 font-bold text-white shadow-lg transition-all hover:shadow-xl">
              <Sparkles size={20} /> Analisis dengan AI <ArrowRight size={18} />
            </button>
          )}
        </div>
      )}

      {/* ===== ANALYZING ===== */}
      {step === 'analyzing' && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#1B2A4A]/10 bg-white py-20 shadow-sm">
          <div className="relative mb-6">
            <div className="h-20 w-20 animate-spin rounded-full border-4 border-[#1B2A4A]/10 border-t-[#C8A951]" />
            <Sparkles size={24} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#C8A951]" />
          </div>
          <p className="text-lg font-bold text-[#1B2A4A]">{AI_ANALYSIS_MESSAGES[analysisMessage]}</p>
          <p className="mt-2 text-sm text-[#5B7088]">Menganalisis {images.length} foto secara terpisah...</p>
        </div>
      )}

      {/* ===== REVIEW ===== */}
      {step === 'review' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1B2A4A]">Hasil Analisis — {imageForms.length} foto</h3>
            {allSaved && (
              <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                <CheckCircle2 size={14} /> Semua tersimpan
              </span>
            )}
          </div>

          {imageForms.map((item, i) => (
            <ImageFormCard key={i} index={i} item={item} />
          ))}

          <div className="flex gap-3 pt-2">
            <button onClick={handleReset} className="flex items-center gap-2 rounded-xl border-2 border-[#1B2A4A]/20 px-5 py-3 font-semibold text-[#1B2A4A] hover:bg-[#1B2A4A]/5">
              <RotateCcw size={18} /> Upload Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
