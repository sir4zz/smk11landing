import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { GraduationCap, Send, CheckCircle, Loader2 } from 'lucide-react'
import PageHero from '../../components/ui/PageHero'
import BkkSubNav from '../../components/bkk/BkkSubNav'
import { usePageBanner } from '../../lib/usePageBanner'
import { fetchPublicContent, kelulusanAdminApi, type AlumniStatus } from '../../lib/api'

const ALUMNI_STATUS_LABELS: Record<AlumniStatus, string> = {
  bekerja: 'Bekerja',
  kuliah: 'Kuliah',
  wirausaha: 'Wirausaha',
  belum_bekerja: 'Belum Bekerja',
}

const inputClass = 'w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2.5 font-normal text-sm'

export default function BkkKelulusan() {
  const { backgroundImage } = usePageBanner('bkk_kelulusan')
  const [programs, setPrograms] = useState<{ name: string; shortName: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [values, setValues] = useState<Record<string, string>>({
    name: '',
    nisn: '',
    major: '',
    graduation_year: '',
    phone: '',
    email: '',
    domicile: '',
    status: 'belum_bekerja',
  })

  const [detail, setDetail] = useState<Record<string, string>>({
    company_name: '',
    position: '',
    job_field: '',
    job_location: '',
    start_year: '',
    wait_time_months: '',
    job_matches_major: 'false',
    university_name: '',
    study_program: '',
    education_level: '',
    entry_year: '',
    business_name: '',
    business_field: '',
    business_location: '',
    business_start_year: '',
    current_status: '',
    reason: '',
  })

  useEffect(() => {
    fetchPublicContent<{ name: string; shortName: string }[]>('programs')
      .then((rows) => setPrograms(rows.filter((r) => r.shortName)))
      .catch(() => {})
  }, [])

  const set = (key: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }))

  const setDetailField = (key: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setDetail((v) => ({ ...v, [key]: e.target.value }))

  const status = values.status as AlumniStatus

  const buildStatusDetail = (): Record<string, unknown> => {
    if (status === 'bekerja') {
      return {
        company_name: detail.company_name,
        position: detail.position,
        job_field: detail.job_field,
        job_location: detail.job_location,
        start_year: detail.start_year,
        wait_time_months: detail.wait_time_months,
        job_matches_major: detail.job_matches_major,
      }
    }
    if (status === 'kuliah') {
      return {
        university_name: detail.university_name,
        study_program: detail.study_program,
        education_level: detail.education_level,
        entry_year: detail.entry_year,
      }
    }
    if (status === 'wirausaha') {
      return {
        business_name: detail.business_name,
        business_field: detail.business_field,
        business_location: detail.business_location,
        business_start_year: detail.business_start_year,
      }
    }
    return {
      current_status: detail.current_status,
      reason: detail.reason,
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!values.name.trim() || !values.nisn.trim()) {
      setError('Nama lengkap dan NISN wajib diisi.')
      return
    }

    setLoading(true)
    const { error: err } = await kelulusanAdminApi.create({
      ...values,
      graduation_year: Number(values.graduation_year) || 0,
      status: values.status,
      status_detail: buildStatusDetail(),
    })
    setLoading(false)

    if (err) {
      setError((err as { message?: string }).message ?? 'Gagal mengirim data. Silakan coba lagi.')
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <>
        <PageHero
          title="Kelulusan Siswa"
          subtitle="Isi data kelulusan Anda setelah lulus dari SMKN 11 Kabupaten Tangerang"
          breadcrumbs={[
            { label: 'Beranda', href: '/' },
            { label: 'BKK', href: '/bkk' },
            { label: 'Kelulusan Siswa', href: '/bkk/kelulusan' },
          ]}
          backgroundImage={backgroundImage}
        />
        <BkkSubNav />
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white p-10 shadow-sm">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-green-50">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#1B2A4A]">Data Berhasil Dikirim!</h2>
            <p className="mt-3 text-[#5B7088]">
              Terima kasih telah mengisi data kelulusan. Data Anda akan diverifikasi oleh admin BKK sebelum ditampilkan.
            </p>
            <button
              onClick={() => { setSuccess(false); setValues({ name: '', nisn: '', major: '', graduation_year: '', phone: '', email: '', domicile: '', status: 'belum_bekerja' }); setDetail({ company_name: '', position: '', job_field: '', job_location: '', start_year: '', wait_time_months: '', job_matches_major: 'false', university_name: '', study_program: '', education_level: '', entry_year: '', business_name: '', business_field: '', business_location: '', business_start_year: '', current_status: '', reason: '' }); }}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-6 py-2.5 font-bold text-white hover:bg-[#15203a]"
            >
              Isi Lagi
            </button>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <PageHero
        title="Kelulusan Siswa"
        subtitle="Isi data kelulusan Anda setelah lulus dari SMKN 11 Kabupaten Tangerang"
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'BKK', href: '/bkk' },
          { label: 'Kelulusan Siswa', href: '/bkk/kelulusan' },
        ]}
        backgroundImage={backgroundImage}
      />
      <BkkSubNav />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#C8A951]/20">
              <GraduationCap className="h-5 w-5 text-[#866D2C]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1B2A4A]">Form Data Kelulusan</h2>
              <p className="text-sm text-[#5B7088]">Lengkapi data berikut dengan benar</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={submit} className="space-y-6">
            {/* Data Dasar */}
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#1B2A4A]/60">Data Dasar</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-[#1B2A4A]">
                  Nama Lengkap *
                  <input value={values.name} onChange={set('name')} className={inputClass} placeholder="Nama lengkap" required />
                </label>
                <label className="block text-sm font-semibold text-[#1B2A4A]">
                  NISN *
                  <input value={values.nisn} onChange={set('nisn')} className={inputClass} placeholder="Nomor Induk Siswa Nasional" required />
                </label>
                <label className="block text-sm font-semibold text-[#1B2A4A]">
                  Jurusan
                  <select value={values.major} onChange={set('major')} className={inputClass}>
                    <option value="">Pilih Jurusan</option>
                    {programs.map((p) => (
                      <option key={p.shortName} value={p.shortName}>{p.shortName} - {p.name}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-[#1B2A4A]">
                  Tahun Lulus
                  <input type="number" value={values.graduation_year} onChange={set('graduation_year')} className={inputClass} placeholder="cth: 2025" />
                </label>
                <label className="block text-sm font-semibold text-[#1B2A4A]">
                  No. HP / WhatsApp
                  <input value={values.phone} onChange={set('phone')} className={inputClass} placeholder="08xxx" />
                </label>
                <label className="block text-sm font-semibold text-[#1B2A4A]">
                  Email
                  <input type="email" value={values.email} onChange={set('email')} className={inputClass} placeholder="email@contoh.com" />
                </label>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-[#1B2A4A]">
                    Domisili Saat Ini
                    <input value={values.domicile} onChange={set('domicile')} className={inputClass} placeholder="Kota/Kabupaten" />
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-[#1B2A4A]">
                    Status Setelah Lulus *
                    <select value={values.status} onChange={set('status')} className={inputClass} required>
                      {Object.entries(ALUMNI_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </div>

            {/* Detail Pekerjaan */}
            {status === 'bekerja' && (
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#1B2A4A]/60">Detail Pekerjaan</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-[#1B2A4A]">
                    Nama Perusahaan
                    <input value={detail.company_name} onChange={setDetailField('company_name')} className={inputClass} />
                  </label>
                  <label className="block text-sm font-semibold text-[#1B2A4A]">
                    Posisi / Jabatan
                    <input value={detail.position} onChange={setDetailField('position')} className={inputClass} />
                  </label>
                  <label className="block text-sm font-semibold text-[#1B2A4A]">
                    Bidang Pekerjaan
                    <input value={detail.job_field} onChange={setDetailField('job_field')} className={inputClass} placeholder="cth: Teknologi Informasi" />
                  </label>
                  <label className="block text-sm font-semibold text-[#1B2A4A]">
                    Lokasi
                    <input value={detail.job_location} onChange={setDetailField('job_location')} className={inputClass} />
                  </label>
                  <label className="block text-sm font-semibold text-[#1B2A4A]">
                    Tahun Mulai Bekerja
                    <input type="number" value={detail.start_year} onChange={setDetailField('start_year')} className={inputClass} />
                  </label>
                  <label className="block text-sm font-semibold text-[#1B2A4A]">
                    Masa Tunggu (bulan)
                    <input type="number" value={detail.wait_time_months} onChange={setDetailField('wait_time_months')} className={inputClass} placeholder="Jumlah bulan" />
                  </label>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-[#1B2A4A]">
                      Pekerjaan Sesuai Jurusan?
                      <select value={detail.job_matches_major} onChange={setDetailField('job_matches_major')} className={inputClass}>
                        <option value="true">Ya</option>
                        <option value="false">Tidak</option>
                      </select>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Detail Kuliah */}
            {status === 'kuliah' && (
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#1B2A4A]/60">Detail Kuliah</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-[#1B2A4A]">
                    Nama Perguruan Tinggi
                    <input value={detail.university_name} onChange={setDetailField('university_name')} className={inputClass} />
                  </label>
                  <label className="block text-sm font-semibold text-[#1B2A4A]">
                    Program Studi
                    <input value={detail.study_program} onChange={setDetailField('study_program')} className={inputClass} />
                  </label>
                  <label className="block text-sm font-semibold text-[#1B2A4A]">
                    Jenjang
                    <select value={detail.education_level} onChange={setDetailField('education_level')} className={inputClass}>
                      <option value="">Pilih Jenjang</option>
                      <option value="D3">D3</option>
                      <option value="D4">D4</option>
                      <option value="S1">S1</option>
                      <option value="S2">S2</option>
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-[#1B2A4A]">
                    Tahun Masuk
                    <input type="number" value={detail.entry_year} onChange={setDetailField('entry_year')} className={inputClass} />
                  </label>
                </div>
              </div>
            )}

            {/* Detail Wirausaha */}
            {status === 'wirausaha' && (
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#1B2A4A]/60">Detail Wirausaha</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-[#1B2A4A]">
                    Nama Usaha
                    <input value={detail.business_name} onChange={setDetailField('business_name')} className={inputClass} />
                  </label>
                  <label className="block text-sm font-semibold text-[#1B2A4A]">
                    Bidang Usaha
                    <input value={detail.business_field} onChange={setDetailField('business_field')} className={inputClass} />
                  </label>
                  <label className="block text-sm font-semibold text-[#1B2A4A]">
                    Lokasi Usaha
                    <input value={detail.business_location} onChange={setDetailField('business_location')} className={inputClass} />
                  </label>
                  <label className="block text-sm font-semibold text-[#1B2A4A]">
                    Tahun Mulai Usaha
                    <input type="number" value={detail.business_start_year} onChange={setDetailField('business_start_year')} className={inputClass} />
                  </label>
                </div>
              </div>
            )}

            {/* Belum Bekerja */}
            {status === 'belum_bekerja' && (
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#1B2A4A]/60">Keterangan</h3>
                <div className="grid gap-4">
                  <label className="block text-sm font-semibold text-[#1B2A4A]">
                    Status / Keterangan Saat Ini
                    <input value={detail.current_status} onChange={setDetailField('current_status')} className={inputClass} placeholder="cth: Sedang mencari kerja, Istirahat, dll." />
                  </label>
                  <label className="block text-sm font-semibold text-[#1B2A4A]">
                    Alasan / Kondisi
                    <textarea value={detail.reason} onChange={setDetailField('reason')} rows={3} className={inputClass} placeholder="Jelaskan kondisi atau alasan saat ini..." />
                  </label>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-6 py-2.5 font-bold text-[#1B2A4A] hover:bg-[#B69740] disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {loading ? 'Mengirim...' : 'Kirim Data'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}
