import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePpdbAuth } from './PPDBAuth'
import { backendApi } from '../../lib/api'
import LoadingScreen, { LoadingInline } from '../../components/ui/LoadingScreen'
import {
  LogOut, User, FileText, CheckCircle2, Clock, AlertCircle,
  ArrowRight, Upload, Save, Send, Home, Trash2
} from 'lucide-react'
import { programs } from '../../data/programs'
import logoSekolah from '../../assets/logo.png'

type Tab = 'biodata' | 'dokumen' | 'review' | 'status'
type Step = 'akun' | 'biodata' | 'dokumen' | 'submit' | 'selesai'

const statusColors: Record<string, string> = {
  'Menunggu Verifikasi': 'bg-[#C8A951]/20 text-[#866D2C] border-[#C8A951]/30',
  'Sedang Diverifikasi': 'bg-blue-50 text-blue-700 border-blue-200',
  'Perlu Perbaikan Dokumen': 'bg-red-50 text-red-700 border-red-200',
  'Lolos Seleksi': 'bg-green-50 text-green-700 border-green-200',
  'Cadangan': 'bg-orange-50 text-orange-700 border-orange-200',
  'Tidak Lolos': 'bg-gray-100 text-gray-600 border-gray-200',
  'Sudah Daftar Ulang': 'bg-green-50 text-green-700 border-green-200',
}

export default function Dashboard() {
  const { user, sessionUser, logout } = usePpdbAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('biodata')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [registration, setRegistration] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [uploading, setUploading] = useState(false)

  /* Form state */
  const [form, setForm] = useState({
    full_name: '', nisn: '', nik: '', gender: '', place_of_birth: '', date_of_birth: '',
    religion: '', address: '', phone: '', father_name: '', father_occupation: '',
    mother_name: '', mother_occupation: '', guardian_name: '', guardian_phone: '',
    parent_address: '', previous_school: '', previous_school_address: '', graduation_year: '', program: ''
  })

  const fetchData = async () => {
    try {
      if (!sessionUser) return;
      const { data: regData } = await backendApi.database.from('ppdb_registrations').select('*').eq('user_id', sessionUser.id).maybeSingle();
      if (regData) {
        setRegistration(regData);
        setForm((prev: any) => ({ ...prev, ...regData }));
        const { data: docs } = await backendApi.database.from('ppdb_documents').select('*').eq('application_id', regData.id).order('created_at', { ascending: true });
        setDocuments(docs || []);
        const { data: acts } = await backendApi.database.from('ppdb_activity_log').select('*').eq('application_id', regData.id).order('created_at', { ascending: false }).limit(20);
        setActivities(acts || []);
      }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { if (sessionUser) void fetchData() }, [sessionUser])

  const currentStep: Step = !registration ? 'biodata' as Step
    : !registration.full_name ? 'biodata'
    : documents.length === 0 ? 'dokumen'
    : registration.status === 'Menunggu Verifikasi' || registration.submitted_at ? 'selesai'
    : 'submit'

  const steps: Array<{ key: Step; label: string; done: boolean }> = [
    { key: 'akun', label: 'Akun', done: true },
    { key: 'biodata', label: 'Biodata', done: currentStep !== 'biodata' },
    { key: 'dokumen', label: 'Dokumen', done: documents.length > 0 },
    { key: 'submit', label: 'Submit', done: currentStep === 'selesai' },
  ]

  const saveBiodata = async () => {
    setSaving(true); setMessage(null)
    try {
      if (registration?.status && registration.status !== 'Menunggu Verifikasi' && registration.status !== 'Perlu Perbaikan Dokumen') {
        throw new Error('Pendaftaran sudah diproses, tidak dapat diubah.');
      }
      
      const payload: Record<string, unknown> = { ...form, user_id: sessionUser?.id };
      
      if (registration?.id) {
         const { error } = await backendApi.database.from('ppdb_registrations').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', registration.id);
         if (error) throw error;
      } else {
         payload.registration_number = 'PPDB' + Math.floor(Math.random()*10000).toString().padStart(4,'0') + Date.now().toString().slice(-4);
         const { error } = await backendApi.database.from('ppdb_registrations').insert([payload]);
         if (error) throw error;
      }
      
      setMessage({ type: 'success', text: 'Biodata berhasil disimpan.' })
      await fetchData()
    } catch (err: any) { setMessage({ type: 'error', text: err.message }) } finally { setSaving(false) }
  }

  const uploadDoc = async (type: string) => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*,.pdf'
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return
      setUploading(true)
      try {
        if (!registration?.id) throw new Error('Lengkapi biodata terlebih dahulu.')
        const existing = documents.find(d => d.type === type);
        if (existing) throw new Error('Dokumen jenis ini sudah diupload. Hapus terlebih dahulu.');
        
        const fileExt = file.name.split('.').pop();
        const filePath = `${sessionUser?.id}/${type}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await backendApi.storage.from('ppdb_documents').upload(filePath, file);
        if (uploadError) throw uploadError;
        
        const { error: dbError } = await backendApi.database.from('ppdb_documents').insert([{
           application_id: registration.id,
           type,
           filename: file.name,
           file_path: uploadData?.key ?? filePath,
           mime_type: file.type,
           file_size: file.size,
           verified: 0
        }]);
        if (dbError) throw dbError;
        
        await backendApi.database.from('ppdb_registrations').update({ documents_count: documents.length + 1 }).eq('id', registration.id);

        setMessage({ type: 'success', text: 'Dokumen berhasil diupload.' })
        await fetchData()
      } catch (err: any) { setMessage({ type: 'error', text: err.message }) } finally { setUploading(false) }
    }; input.click()
  }

  const deleteDoc = async (id: string, path: string) => {
    if (!confirm('Hapus dokumen ini?')) return
    try {
      if (path) await backendApi.storage.from('ppdb_documents').remove([path]);
      await backendApi.database.from('ppdb_documents').delete().eq('id', id);
      await backendApi.database.from('ppdb_registrations').update({ documents_count: Math.max(0, documents.length - 1) }).eq('id', registration.id);
      await fetchData()
    } catch {}
  }

  const submitApplication = async () => {
    if (!confirm('Yakin ingin mengirim pendaftaran? Data tidak dapat diubah setelah dikirim.')) return
    setSaving(true)
    try {
      if (registration.status !== 'Menunggu Verifikasi' && registration.status !== 'Perlu Perbaikan Dokumen') throw new Error(`Pendaftaran sudah dalam status "${registration.status}".`);
      if (documents.length === 0) throw new Error('Upload minimal 1 dokumen sebelum submit.');

      const { error } = await backendApi.database.from('ppdb_registrations').update({ status: 'Menunggu Verifikasi', submitted_at: new Date().toISOString() }).eq('id', registration.id);
      if (error) throw error;
      
      await backendApi.database.from('ppdb_activity_log').insert([{ application_id: registration.id, action: 'Submit Pendaftaran', note: 'Pendaftaran berhasil dikirim.' }]);

      setMessage({ type: 'success', text: 'Pendaftaran berhasil dikirim!' })
      await fetchData()
    } catch (err: any) { setMessage({ type: 'error', text: err.message }) } finally { setSaving(false) }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev: any) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const tabs: Array<{ key: Tab; label: string; icon: typeof User; count?: number }> = [
    { key: 'biodata', label: 'Biodata', icon: User },
    { key: 'dokumen', label: 'Dokumen', icon: FileText, count: documents.length },
    { key: 'review', label: 'Review & Submit', icon: Send },
    { key: 'status', label: 'Status', icon: Clock },
  ]

  if (loading) return <LoadingScreen message="Memuat dashboard..." />

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      {/* Header */}
      <header className="border-b border-[#1B2A4A]/10 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <img src={logoSekolah} alt="Logo SMKN 11" className="h-8 w-auto" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
            <span className="font-bold text-[#1B2A4A]">PPDB SMKN 11</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-[#23314D] hover:text-[#C8A951]"><Home className="inline h-4 w-4" /></Link>
            <span className="text-sm text-[#23314D]">{user?.name}</span>
            <button onClick={() => { logout(); navigate('/ppdb/masuk') }} className="flex items-center gap-1 text-sm text-red-600"><LogOut className="h-4 w-4" /> Keluar</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Stepper */}
        <div className="mb-8 flex items-center justify-center gap-2 sm:gap-4">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2 sm:gap-4">
              <div className={`flex items-center gap-2 ${s.done ? 'text-[#1B2A4A]' : 'text-[#23314D]/50'}`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  s.done ? 'bg-[#C8A951] text-[#1B2A4A]' : 'border-2 border-[#23314D]/20 text-[#23314D]/40'
                }`}>
                  {s.done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className="hidden text-sm font-semibold sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`h-px w-8 sm:w-16 ${s.done ? 'bg-[#C8A951]' : 'bg-[#23314D]/20'}`} />}
            </div>
          ))}
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 rounded-xl border p-4 text-sm font-medium ${
            message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Status Banner */}
        {registration?.status && (
          <div className={`mb-6 rounded-xl border p-4 ${statusColors[registration.status] || 'bg-gray-50 text-gray-600'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  Status: <span className="font-bold">{registration.status}</span>
                </p>
                {registration.registration_number && (
                  <p className="mt-1 text-xs opacity-75">No. Daftar: {registration.registration_number}</p>
                )}
              </div>
              <div className="flex items-center gap-2">{/* quick actions */}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex overflow-x-auto border-b border-[#1B2A4A]/10 whitespace-nowrap">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                tab === t.key ? 'border-[#C8A951] text-[#1B2A4A]' : 'border-transparent text-[#23314D]/60 hover:text-[#1B2A4A]'
              }`}>
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.count !== undefined && <span className="rounded-full bg-[#C8A951]/20 px-2 py-0.5 text-xs">{t.count}</span>}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'biodata' && (
          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-6 text-xl font-bold text-[#1B2A4A]">Data Pribadi</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <Label label="Nama Lengkap"><input name="full_name" value={form.full_name} onChange={handleChange} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-4 py-3 text-sm" /></Label>
              <Label label="NISN"><input name="nisn" value={form.nisn} inputMode="numeric" onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setForm(f => ({ ...f, nisn: v })) }} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-4 py-3 text-sm" /></Label>
              <Label label="NIK"><input name="nik" value={form.nik} inputMode="numeric" onChange={e => setForm(f => ({ ...f, nik: e.target.value.replace(/\D/g, '') }))} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-4 py-3 text-sm" /></Label>
              <Label label="Jenis Kelamin">
                <select name="gender" value={form.gender} onChange={handleChange} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 bg-white px-4 py-3 text-sm">
                  <option value="">Pilih</option><option value="L">Laki-laki</option><option value="P">Perempuan</option>
                </select>
              </Label>
              <Label label="Tempat Lahir"><input name="place_of_birth" value={form.place_of_birth} onChange={handleChange} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-4 py-3 text-sm" /></Label>
              <Label label="Tanggal Lahir"><input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-4 py-3 text-sm" /></Label>
              <Label label="Agama"><input name="religion" value={form.religion} onChange={handleChange} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-4 py-3 text-sm" /></Label>
              <Label label="No. HP/WA"><input name="phone" value={form.phone} inputMode="numeric" onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-4 py-3 text-sm" /></Label>
              <Label label="Alamat" className="md:col-span-2"><textarea name="address" value={form.address} onChange={handleChange} rows={3} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-4 py-3 text-sm" /></Label>
            </div>

            <h2 className="mb-6 mt-8 text-xl font-bold text-[#1B2A4A]">Data Orang Tua / Wali</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <Label label="Nama Ayah"><input name="father_name" value={form.father_name} onChange={handleChange} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-4 py-3 text-sm" /></Label>
              <Label label="Pekerjaan Ayah"><input name="father_occupation" value={form.father_occupation} onChange={handleChange} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-4 py-3 text-sm" /></Label>
              <Label label="Nama Ibu"><input name="mother_name" value={form.mother_name} onChange={handleChange} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-4 py-3 text-sm" /></Label>
              <Label label="Pekerjaan Ibu"><input name="mother_occupation" value={form.mother_occupation} onChange={handleChange} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-4 py-3 text-sm" /></Label>
              <Label label="Nama Wali"><input name="guardian_name" value={form.guardian_name} onChange={handleChange} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-4 py-3 text-sm" /></Label>
              <Label label="No. HP Wali"><input name="guardian_phone" value={form.guardian_phone} inputMode="numeric" onChange={e => setForm(f => ({ ...f, guardian_phone: e.target.value.replace(/\D/g, '') }))} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-4 py-3 text-sm" /></Label>
              <Label label="Alamat Orang Tua" className="md:col-span-2"><textarea name="parent_address" value={form.parent_address} onChange={handleChange} rows={2} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-4 py-3 text-sm" /></Label>
            </div>

            <h2 className="mb-6 mt-8 text-xl font-bold text-[#1B2A4A]">Data Sekolah Asal & Jurusan</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <Label label="Sekolah Asal"><input name="previous_school" value={form.previous_school} onChange={handleChange} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-4 py-3 text-sm" /></Label>
              <Label label="Alamat Sekolah"><input name="previous_school_address" value={form.previous_school_address} onChange={handleChange} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-4 py-3 text-sm" /></Label>
              <Label label="Tahun Lulus"><input name="graduation_year" type="number" value={form.graduation_year} inputMode="numeric" onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); setForm(f => ({ ...f, graduation_year: v })) }} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-4 py-3 text-sm" /></Label>
              <Label label="Program Keahlian Pilihan">
                <select name="program" value={form.program} onChange={handleChange} className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 bg-white px-4 py-3 text-sm">
                  <option value="">Pilih jurusan</option>
                  {programs.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </Label>
            </div>

            <div className="mt-8 flex justify-end">
              <button onClick={saveBiodata} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#1B2A4A] px-6 py-3 font-bold text-white disabled:opacity-70">
                <Save className="h-4 w-4" /> {saving ? 'Menyimpan...' : 'Simpan Biodata'}
              </button>
            </div>
          </div>
        )}

        {tab === 'dokumen' && (
          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-6 text-xl font-bold text-[#1B2A4A]">Upload Dokumen</h2>
            <p className="mb-6 text-sm text-[#23314D]">Upload dokumen persyaratan pendaftaran. Format: JPG, PNG, atau PDF. Jika status <span className="font-semibold text-red-600">Perlu Perbaikan</span>, upload ulang dokumen yang diminta.</p>

            <div className="grid gap-4 md:grid-cols-2">
              {([
                { key: 'pas_foto', label: 'Pas Foto', hint: '3x4, background merah/biru' },
                { key: 'kartu_keluarga', label: 'Kartu Keluarga', hint: 'Scan/foto KK' },
                { key: 'akta_kelahiran', label: 'Akta Kelahiran', hint: 'Scan/foto akta' },
                { key: 'rapor', label: 'Rapor', hint: 'Nilai semester 1-5' },
                { key: 'skl', label: 'SKL / Ijazah', hint: 'Surat Keterangan Lulus' },
                { key: 'dokumen_pendukung', label: 'Dokumen Pendukung', hint: 'Piagam prestasi dll.' },
              ] as const).map(({ key, label, hint }) => {
                const doc = documents.find((d: any) => d.type === key)
                return (
                  <div key={key} className={`rounded-xl border p-5 ${doc ? (doc.verified ? 'border-green-200 bg-green-50/30' : 'border-[#1B2A4A]/10') : 'border-dashed border-[#1B2A4A]/20'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-[#1B2A4A]">{label}</h3>
                        <p className="mt-0.5 text-xs text-[#23314D]/60">{hint}</p>
                        {doc && (
                          <div className="mt-2 flex items-center gap-3 text-xs">
                            <span className={`rounded-full px-2 py-0.5 font-medium ${doc.verified ? 'bg-green-100 text-green-700' : doc.verified === 0 && doc.note ? 'bg-red-100 text-red-700' : 'bg-[#C8A951]/20 text-[#866D2C]'}`}>
                              {doc.verified ? 'Terverifikasi' : doc.note ? 'Ditolak' : 'Menunggu'}
                            </span>
                            <span className="text-[#23314D]/50">{doc.filename}</span>
                          </div>
                        )}
                        {doc?.note && <p className="mt-1 text-xs text-red-600">Catatan: {doc.note}</p>}
                      </div>
                      <div className="flex gap-2">
                        {doc && (
                          <button onClick={() => deleteDoc(doc.id, doc.file_path)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                        )}
                        <button onClick={() => uploadDoc(key)} disabled={uploading} className="rounded-lg bg-[#C8A951] p-2 text-[#1B2A4A] hover:bg-[#B59640] disabled:opacity-50">
                          <Upload className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'review' && (
          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-6 text-xl font-bold text-[#1B2A4A]">Review & Submit Pendaftaran</h2>

            {currentStep === 'biodata' && (
              <div className="rounded-xl border border-dashed border-[#C8A951]/30 bg-[#C8A951]/5 p-8 text-center">
                <AlertCircle className="mx-auto mb-3 h-10 w-10 text-[#C8A951]" />
                <p className="font-semibold text-[#1B2A4A]">Lengkapi biodata terlebih dahulu</p>
                <button onClick={() => setTab('biodata')} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#C8A951]">
                  Isi Biodata <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {currentStep === 'dokumen' && (
              <div className="rounded-xl border border-dashed border-[#C8A951]/30 bg-[#C8A951]/5 p-8 text-center">
                <Upload className="mx-auto mb-3 h-10 w-10 text-[#C8A951]" />
                <p className="font-semibold text-[#1B2A4A]">Upload minimal 1 dokumen</p>
                <button onClick={() => setTab('dokumen')} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#C8A951]">
                  Upload Dokumen <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {currentStep === 'submit' && registration && (
              <div>
                <div className="mb-6 space-y-3 rounded-xl bg-[#FAF6F0] p-6">
                  <p className="flex justify-between"><span className="text-[#23314D]">No. Pendaftaran:</span><span className="font-bold text-[#1B2A4A]">{registration.registration_number}</span></p>
                  <p className="flex justify-between"><span className="text-[#23314D]">Nama:</span><span className="font-semibold text-[#1B2A4A]">{registration.full_name}</span></p>
                  <p className="flex justify-between"><span className="text-[#23314D]">Jurusan:</span><span className="font-semibold text-[#1B2A4A]">{registration.program}</span></p>
                  <p className="flex justify-between"><span className="text-[#23314D]">Dokumen diupload:</span><span className="font-semibold text-[#1B2A4A]">{documents.length} file</span></p>
                </div>

                <button onClick={submitApplication} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C8A951] px-8 py-4 font-bold text-[#1B2A4A] disabled:opacity-70">
                  {saving ? <LoadingInline size="sm" /> : <Send className="h-5 w-5" />}
                  {saving ? 'Mengirim...' : 'Kirim Pendaftaran'}
                </button>
                <p className="mt-3 text-center text-xs text-[#23314D]/50">Setelah dikirim, data tidak dapat diubah kecuali diminta oleh admin.</p>
              </div>
            )}

            {currentStep === 'selesai' && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-600" />
                <h3 className="text-xl font-bold text-green-800">Pendaftaran Terkirim!</h3>
                <p className="mt-2 text-green-700">Pendaftaran Anda sedang dalam proses verifikasi. Pantau status secara berkala.</p>
                <button onClick={() => setTab('status')} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-green-700">
                  Lihat Status <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'status' && (
          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-6 text-xl font-bold text-[#1B2A4A]">Status Pendaftaran</h2>

            {!registration ? (
              <div className="rounded-xl bg-[#FAF6F0] p-8 text-center">
                <p className="text-[#23314D]">Belum ada data pendaftaran. Lengkapi biodata terlebih dahulu.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Current Status */}
                <div className={`rounded-xl border-2 p-6 ${registration.status === 'Lolos Seleksi' || registration.status === 'Sudah Daftar Ulang' ? 'border-green-300 bg-green-50' : 'border-[#C8A951]/30 bg-[#FAF6F0]'}`}>
                  <div className="mb-2 text-sm text-[#23314D]/60">Status Saat Ini</div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${statusColors[registration.status] || 'bg-gray-100 text-gray-600'}`}>
                      {registration.status}
                    </span>
                    {registration.submitted_at && <span className="text-sm text-[#23314D]/50">sejak {new Date(registration.submitted_at).toLocaleDateString('id-ID')}</span>}
                  </div>
                  {registration.admin_note && (
                    <div className="mt-4 rounded-lg bg-white p-4 text-sm text-[#23314D]">
                      <span className="font-semibold">Catatan Admin:</span> {registration.admin_note}
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="mb-4 font-semibold text-[#1B2A4A]">Riwayat Aktivitas</h3>
                  {activities.length === 0 ? (
                    <p className="text-sm text-[#23314D]/50">Belum ada aktivitas.</p>
                  ) : (
                    <div className="relative space-y-0">
                      {activities.map((act: any, i: number) => (
                        <div key={i} className="relative flex gap-4 pb-6">
                          <div className="flex flex-col items-center">
                            <div className={`z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                              act.action?.includes('Lolos') || act.action?.includes('Daftar Ulang') ? 'bg-green-100 text-green-700' :
                              act.action?.includes('Tidak Lolos') ? 'bg-red-100 text-red-700' :
                              act.action?.includes('Verifikasi') ? 'bg-blue-100 text-blue-700' :
                              'bg-[#C8A951]/20 text-[#866D2C]'
                            }`}>
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                            {i < activities.length - 1 && <div className="h-full w-px bg-[#1B2A4A]/10" />}
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="text-sm font-semibold text-[#1B2A4A]">{act.action}</p>
                            {act.note && <p className="text-xs text-[#23314D]/70">{act.note}</p>}
                            <p className="mt-0.5 text-xs text-[#23314D]/40">{new Date(act.created_at).toLocaleString('id-ID')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Label({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return <label className={`block text-sm font-semibold text-[#1B2A4A] ${className || ''}`}>{label}{children}</label>
}
