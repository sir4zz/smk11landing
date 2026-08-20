import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { UserRound, Loader2, Send, X, Clock, CheckCircle2, XCircle, ChevronRight, FileText, Eye } from 'lucide-react';
import { backendApi, studentDataApi, resolveImageUrl, STUDENT_CHANGE_REQUEST_STATUS_LABELS, type StudentDataPayload, type StudentChangeRequestRow, type StudentChangeRequestStatus } from '../../lib/api';
import PageHero from '../../components/ui/PageHero';
import { BIODATA_FIELDS, BIODATA_SECTIONS, emptyBiodata } from '../../lib/studentBiodata';
import type { BiodataFieldDef } from '../../lib/studentBiodata';
import ImageField from '../../components/admin/ImageField';

const studentSessionKey = 'smkn11-student-session';

const dateForInput = (value: unknown): string => (typeof value === 'string' ? value.slice(0, 10) : '');

function initFormFrom(student: StudentDataPayload | null): Record<string, string> {
  const form = emptyBiodata();
  if (!student) return form;
  for (const field of BIODATA_FIELDS) {
    const raw = (student as Record<string, unknown>)[field.key];
    if (raw === null || raw === undefined) continue;
    if (field.type === 'date') form[field.key] = dateForInput(raw);
    else form[field.key] = String(raw);
  }
  form.nisn = String(student.nisn ?? '');
  form.nis = String(student.nis ?? '');
  form.name = String(student.name ?? '');
  form.class = String(student.class ?? '');
  form.major = String(student.major ?? '');
  form.gender = String(student.gender ?? '');
  form.date_of_birth = dateForInput(student.date_of_birth);
  form.place_of_birth = String(student.place_of_birth ?? '');
  form.religion = String(student.religion ?? '');
  form.address = String(student.address ?? '');
  form.foto = String(student.foto ?? '');
  return form;
}

export default function DataSiswa() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [studentData, setStudentData] = useState<StudentDataPayload | null>(null);
  const [requests, setRequests] = useState<StudentChangeRequestRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(emptyBiodata());
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [detailRequest, setDetailRequest] = useState<StudentChangeRequestRow | null>(null);

  const totalSteps = BIODATA_SECTIONS.length;

  const loadData = useCallback(async () => {
    const { data: userData } = await backendApi.auth.getCurrentUser();
    if (!userData?.user) {
      setLoading(false);
      return;
    }
    setUser({ id: userData.user.id, email: userData.user.email });

    const { data: profile } = await backendApi.database
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (profile?.role !== 'student') {
      await backendApi.auth.signOut();
      localStorage.removeItem(studentSessionKey);
      navigate('/mading/login', { replace: true });
      return;
    }

    const [dataResult, requestsResult] = await Promise.all([
      studentDataApi.myData(),
      studentDataApi.myChangeRequests(),
    ]);

    if (dataResult.data) setStudentData(dataResult.data);
    if (requestsResult.data) setRequests(requestsResult.data as StudentChangeRequestRow[]);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  const openEditForm = () => {
    setForm(initFormFrom(studentData));
    setStep(1);
    setMaxStep(1);
    setErrors({});
    setShowForm(true);
  };

  const setValue = (key: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((v) => ({ ...v, [key]: e.target.value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateStep = (current: Record<string, string>, stepIdx: number): Record<string, string> => {
    const fieldErrors: Record<string, string> = {};
    const section = BIODATA_SECTIONS[stepIdx - 1];
    const fields = BIODATA_FIELDS.filter((f) => f.section === section.id);

    for (const f of fields) {
      const value = (current[f.key] ?? '').trim();
      if (!value) continue;
      if (f.type === 'number' && !/^\d+(\.\d+)?$/.test(value)) fieldErrors[f.key] = 'Harus berupa angka.';
      if (f.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) fieldErrors[f.key] = 'Tanggal tidak valid.';
    }

    return fieldErrors;
  };

  const goNext = () => {
    const fieldErrors = validateStep(form, step);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    const next = Math.min(step + 1, totalSteps);
    setStep(next);
    setMaxStep((prev) => Math.max(prev, next));
    setErrors({});
  };

  const goBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
    setErrors({});
  };

  const jumpTo = (target: number) => {
    if (target <= maxStep && target >= 1) {
      setStep(target);
      setErrors({});
    }
  };

  const submitChangeRequest = async () => {
    if (!studentData) return;
    setSaving(true);
    setMsg(null);

    const currentErrors = validateStep(form, step);
    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      setSaving(false);
      return;
    }

    // Build only changed fields
    const proposedData: Record<string, unknown> = {};
    for (const field of BIODATA_FIELDS) {
      const newVal = form[field.key] ?? '';
      const oldVal = String((studentData as Record<string, unknown>)[field.key] ?? '');
      if (newVal !== oldVal) {
        proposedData[field.key] = field.type === 'number' ? (newVal === '' ? null : Number(newVal)) : newVal;
      }
    }

    if (Object.keys(proposedData).length === 0) {
      flash('err', 'Tidak ada perubahan yang terdeteksi.');
      setSaving(false);
      return;
    }

    const { error } = await studentDataApi.submitChangeRequest(proposedData);
    setSaving(false);

    if (error) {
      flash('err', error.message ?? 'Gagal mengirim pengajuan.');
      return;
    }

    setShowForm(false);
    flash('ok', 'Pengajuan perubahan data berhasil dikirim. Menunggu verifikasi Operator Sekolah.');
    void loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="Data Siswa" subtitle="Lihat dan kelola data biodata Anda" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Ruang Siswa', href: '/siswa/data-diri' }, { label: 'Data Diri' }]} />
        <div className="py-24"><Loader2 className="mx-auto h-10 w-10 animate-spin text-[#C8A951]" /></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/mading/login" replace />;
  if (!studentData) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <PageHero title="Data Siswa" subtitle="Lihat dan kelola data biodata Anda" breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Ruang Siswa', href: '/siswa/data-diri' }, { label: 'Data Diri' }]} />
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-[#5B7088]">Data siswa tidak ditemukan.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <PageHero
        title="Data Siswa"
        subtitle={`${studentData.name} — NISN ${studentData.nisn}`}
        breadcrumbs={[{ label: 'Beranda', href: '/' }, { label: 'Ruang Siswa', href: '#' }, { label: 'Data Diri' }]}
      />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {msg && <p className={`mb-4 rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}

        {/* Action Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#5B7088]">Berikut adalah data biodata Anda saat ini. Jika ada data yang perlu diperbarui, silakan ajukan perubahan.</p>
          {!showForm && (
            <button onClick={openEditForm} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-5 py-2.5 font-bold text-[#1B2A4A]">
              <FileText size={18} /> Ajukan Perubahan Data
            </button>
          )}
        </div>

        {/* Student Data Display */}
        <StudentDataView student={studentData} />

        {/* Change Request Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 py-10">
            <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#1B2A4A]">Ajukan Perubahan Data</h3>
                <button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button>
              </div>

              <p className="mb-4 rounded-lg bg-[#C8A951]/10 p-3 text-sm text-[#866D2C]">
                Perubahan data akan dikirim sebagai pengajuan dan menunggu verifikasi oleh Operator Sekolah. Data utama tidak akan berubah sampai disetujui.
              </p>

              {/* Step Navigation */}
              <div className="mb-5 flex items-center gap-1 overflow-x-auto pb-1">
                {BIODATA_SECTIONS.map((section, i) => {
                  const n = i + 1;
                  const active = n === step;
                  const done = n < step;
                  const reachable = n <= maxStep;
                  return (
                    <span key={section.id} className="contents">
                      {i > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-[#5B7088]/40" />}
                      <button
                        type="button"
                        disabled={!reachable}
                        onClick={() => jumpTo(n)}
                        title={section.title}
                        className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                          active ? 'bg-[#1B2A4A] text-white'
                            : done ? 'bg-[#C8A951] text-[#1B2A4A]'
                              : reachable ? 'bg-[#FAF6F0] text-[#5B7088] hover:bg-[#1B2A4A]/10'
                                : 'cursor-not-allowed bg-[#FAF6F0] text-[#5B7088]/40'
                        }`}
                      >
                        {n}. {section.title.replace(/^[A-J]\.\s*/, '')}
                      </button>
                    </span>
                  );
                })}
              </div>

              {/* Step Content */}
              {(() => {
                const section = BIODATA_SECTIONS[step - 1];
                const fields = BIODATA_FIELDS.filter((f) => f.section === section.id);
                return (
                  <div key={section.id} className="rounded-xl border border-[#1B2A4A]/10 p-4">
                    <p className="mb-3 font-bold text-[#1B2A4A]">{section.title}</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {section.id === 'identity' && (
                        <div className="sm:col-span-2">
                          <ImageField label="Foto Siswa (opsional)" value={form.foto ?? ''} onChange={(url) => setForm((v) => ({ ...v, foto: url }))} accept="image/jpeg,image/png" maxSizeMb={2} hint="JPG/JPEG atau PNG, maks. 2 MB." />
                        </div>
                      )}
                      {fields.map((field) => (
                        <BiodataField key={field.key} field={field} value={form[field.key] ?? ''} onChange={setValue(field.key)} error={errors[field.key]} />
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-[#5B7088]">Batal</button>
                {step > 1 && (
                  <button type="button" onClick={goBack} className="px-4 py-2 font-semibold text-[#866D2C]">Kembali</button>
                )}
                {step < totalSteps ? (
                  <button type="button" onClick={goNext} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2 font-bold text-white">
                    Lanjut <ChevronRight size={16} />
                  </button>
                ) : (
                  <button type="button" onClick={submitChangeRequest} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-5 py-2 font-bold text-[#1B2A4A] disabled:opacity-60">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Kirim Pengajuan
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Change Request History */}
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-bold text-[#1B2A4A]">Riwayat Pengajuan Perubahan</h2>
          {requests.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 sm:p-10 text-center shadow-sm">
              <Clock className="mx-auto mb-3 h-10 w-10 text-[#C8A951]/40" />
              <p className="text-[#5B7088]">Belum ada pengajuan perubahan data.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <RequestCard key={req.id} request={req} onView={() => setDetailRequest(req)} />
              ))}
            </div>
          )}
        </div>

        {/* Request Detail Modal */}
        {detailRequest && (
          <RequestDetailModal request={detailRequest} onClose={() => setDetailRequest(null)} />
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────

function StudentDataView({ student }: { student: StudentDataPayload }) {
  return (
    <div className="space-y-6">
      {BIODATA_SECTIONS.map((section) => {
        const fields = BIODATA_FIELDS.filter((f) => f.section === section.id);
        const isIdentity = section.id === 'identity';
        return (
          <div key={section.id} className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="mb-4 font-bold text-[#1B2A4A]">{section.title}</p>
            {isIdentity && (
              <div className="mb-4 flex items-center gap-4">
                {(student as Record<string, unknown>).foto ? (
                  <img src={resolveImageUrl(String((student as Record<string, unknown>).foto))} alt={student.name} className="h-24 w-24 rounded-lg border border-[#1B2A4A]/10 object-cover" />
                ) : (
                  <span className="grid h-24 w-24 place-items-center rounded-lg border border-dashed border-[#1B2A4A]/20 bg-[#FAF6F0]">
                    <UserRound className="h-10 w-10 text-[#866D2C]/50" />
                  </span>
                )}
                <div>
                  <p className="font-bold text-[#1B2A4A]">{student.name}</p>
                  <p className="text-sm text-[#5B7088]">NISN: {student.nisn}</p>
                </div>
              </div>
            )}
            <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
              {fields.map((field) => (
                <DetailRow key={field.key} label={field.label} value={detailValue(field, (student as Record<string, unknown>)[field.key])} />
              ))}
            </dl>
          </div>
        );
      })}
    </div>
  );
}

function RequestCard({ request, onView }: { request: StudentChangeRequestRow; onView: () => void }) {
  const statusConfig: Record<StudentChangeRequestStatus, { label: string; cls: string; icon: typeof Clock }> = {
    menunggu: { label: STUDENT_CHANGE_REQUEST_STATUS_LABELS.menunggu, cls: 'bg-[#C8A951]/20 text-[#866D2C]', icon: Clock },
    disetujui: { label: STUDENT_CHANGE_REQUEST_STATUS_LABELS.disetujui, cls: 'bg-green-50 text-green-700', icon: CheckCircle2 },
    ditolak: { label: STUDENT_CHANGE_REQUEST_STATUS_LABELS.ditolak, cls: 'bg-red-50 text-red-700', icon: XCircle },
    dibatalkan: { label: STUDENT_CHANGE_REQUEST_STATUS_LABELS.dibatalkan, cls: 'bg-[#FAF6F0] text-[#5B7088]', icon: XCircle },
  };
  const conf = statusConfig[request.status] ?? statusConfig.menunggu;
  const Icon = conf.icon;
  const fieldCount = Object.keys(request.proposed_data).length;

  return (
    <div className="rounded-2xl border border-[#1B2A4A]/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${conf.cls}`}>
              <Icon className="h-3 w-3" /> {conf.label}
            </span>
            <span className="text-xs text-[#5B7088]">
              {fieldCount} field diubah
            </span>
          </div>
          <p className="mt-1 text-xs text-[#5B7088]">
            Diajukan {request.created_at ? new Date(request.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
          </p>
        </div>
        <button onClick={onView} className="inline-flex items-center gap-1 text-sm font-semibold text-[#866D2C]">
          <Eye size={15} /> Detail
        </button>
      </div>
      {request.status === 'ditolak' && request.rejection_reason && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"><strong>Alasan Penolakan:</strong> {request.rejection_reason}</p>
      )}
    </div>
  );
}

function RequestDetailModal({ request, onClose }: { request: StudentChangeRequestRow; onClose: () => void }) {
  const allFields = [...BIODATA_FIELDS];
  const changedKeys = Object.keys(request.proposed_data);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#1B2A4A]">Detail Pengajuan Perubahan</h3>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>

        <div className="mb-4 rounded-lg bg-[#FAF6F0] p-3 text-xs text-[#5B7088]">
          Status: <strong>{STUDENT_CHANGE_REQUEST_STATUS_LABELS[request.status]}</strong>
          {request.verified_at && <> — Diverifikasi {new Date(request.verified_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</>}
        </div>

        {request.status === 'ditolak' && request.rejection_reason && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <strong>Alasan Penolakan:</strong> {request.rejection_reason}
          </div>
        )}

        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAF6F0]">
              <tr>
                <th className="p-3 font-semibold text-[#1B2A4A]">Field</th>
                <th className="p-3 font-semibold text-[#1B2A4A]">Data Lama</th>
                <th className="p-3 font-semibold text-[#1B2A4A]">Data Baru</th>
              </tr>
            </thead>
            <tbody>
              {changedKeys.map((key) => {
                const fieldDef = allFields.find((f) => f.key === key);
                const label = fieldDef?.label ?? key;
                const oldVal = request.old_data[key];
                const newVal = request.proposed_data[key];
                return (
                  <tr key={key} className="border-t border-[#1B2A4A]/10">
                    <td className="p-3 font-medium text-[#5B7088]">{label}</td>
                    <td className="p-3 text-[#1B2A4A]">{oldVal === null || oldVal === undefined || oldVal === '' ? '-' : String(oldVal)}</td>
                    <td className="p-3 font-semibold text-green-700">{newVal === null || newVal === undefined || newVal === '' ? '-' : String(newVal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex justify-end">
          <button onClick={onClose} className="rounded-lg border-2 border-[#1B2A4A] px-5 py-2 font-bold text-[#1B2A4A]">Tutup</button>
        </div>
      </div>
    </div>
  );
}

function BiodataField({ field, value, onChange, error }: { field: BiodataFieldDef; value: string; onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void; error?: string }) {
  const cls = field.full ? 'sm:col-span-2' : '';
  const inputCls = `mt-1 w-full rounded-lg border bg-white px-3 py-2 font-normal ${error ? 'border-red-400' : 'border-[#1B2A4A]/20'}`;

  return (
    <label className={`block text-sm font-semibold ${cls}`}>
      {field.label}
      {field.type === 'select' ? (
        <select value={value} onChange={onChange} className={inputCls}>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt === '' ? 'Pilih' : opt}</option>
          ))}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea value={value} onChange={onChange} rows={2} className={inputCls} placeholder={field.placeholder} />
      ) : (
        <input value={value} type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} onChange={onChange} className={inputCls} placeholder={field.placeholder} />
      )}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

function DetailRow({ label, value }: { label: string; value: unknown }) {
  const display = value === null || value === undefined || value === '' ? '-' : String(value);
  return (
    <div className="flex gap-2">
      <dt className="w-28 sm:w-44 shrink-0 font-medium text-[#5B7088]">{label}</dt>
      <dd className="font-semibold text-[#1B2A4A]">{display}</dd>
    </div>
  );
}

function detailValue(field: BiodataFieldDef, raw: unknown): string {
  if (raw === null || raw === undefined || raw === '') return '-';
  if (field.type === 'date') return formatDate(String(raw));
  if (field.key === 'gender') return raw === 'L' ? 'Laki-laki' : raw === 'P' ? 'Perempuan' : String(raw);
  return String(raw);
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return value;
}
