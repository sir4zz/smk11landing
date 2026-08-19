import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Loader2, Save, KeyRound, IdCard, BadgeCheck, Globe } from 'lucide-react';
import { myProfileApi, type MyProfilePayload } from '../../lib/api';
import ImageField from './ImageField';
import GuruSdmProfile from './GuruSdmProfile';
import { useStaffAuth } from '../../lib/staffAuth';

interface FormState {
  photo: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  address: string;
  instagram: string;
  facebook: string;
  twitter: string;
  tiktok: string;
  youtube: string;
  linkedin: string;
  website: string;
  github: string;
  subject: string;
  position: string;
  division: string;
  achievements: string;
  certifications: string;
  work_programs: string;
}

const emptyForm: FormState = {
  photo: '', name: '', email: '', phone: '', bio: '', address: '',
  instagram: '', facebook: '', twitter: '', tiktok: '', youtube: '', linkedin: '', website: '', github: '',
  subject: '', position: '', division: '', achievements: '', certifications: '', work_programs: '',
};

const SOCIAL_FIELDS: { key: keyof FormState; label: string; optional?: boolean; placeholder: string }[] = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/username' },
  { key: 'twitter', label: 'X (Twitter)', placeholder: 'https://x.com/username' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@username' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@channel' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
  { key: 'website', label: 'Website Pribadi', optional: true, placeholder: 'https://...' },
  { key: 'github', label: 'GitHub', optional: true, placeholder: 'https://github.com/username' },
];

export default function MyProfile() {
  const { role } = useStaffAuth();
  const [profile, setProfile] = useState<MyProfilePayload | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  const load = useCallback(async () => {
    const { data, error } = await myProfileApi.show();
    if (error) {
      setMsg({ type: 'err', text: error.message ?? 'Gagal memuat profil.' });
      setLoading(false);
      return;
    }
    if (!data) {
      setLoading(false);
      return;
    }
    setProfile(data);
    setForm({
      photo: data.photo ?? '',
      name: data.name ?? '',
      email: data.email ?? '',
      phone: data.phone ?? '',
      bio: data.bio ?? '',
      address: data.address ?? '',
      instagram: data.social?.instagram ?? '',
      facebook: data.social?.facebook ?? '',
      twitter: data.social?.twitter ?? '',
      tiktok: data.social?.tiktok ?? '',
      youtube: data.social?.youtube ?? '',
      linkedin: data.social?.linkedin ?? '',
      website: data.social?.website ?? '',
      github: data.social?.github ?? '',
      subject: data.guru?.subject ?? '',
      position: data.guru?.position ?? data.osis?.position ?? '',
      division: data.osis?.division ?? '',
      achievements: (data.guru?.achievements ?? data.osis?.achievements ?? data.student?.achievements ?? []).join('\n'),
      certifications: (data.guru?.certifications ?? []).join('\n'),
      work_programs: (data.osis?.work_programs ?? []).join('\n'),
    });
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const setField = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((v) => ({ ...v, [key]: e.target.value }));

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMsg(null);

    const name = form.name.trim();
    if (name.length < 2) {
      flash('err', 'Nama wajib diisi.');
      setSaving(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      flash('err', 'Email wajib diisi dengan benar.');
      setSaving(false);
      return;
    }

    const splitLines = (value: string) => value.split('\n').map((s) => s.trim()).filter(Boolean);

    const isSdmGuru = role === 'guru' && !!profile?.guru_sdm;

    const payload: Record<string, unknown> = {
      email: form.email.trim(),
    };

    if (!isSdmGuru) {
      payload.name = name;
    }

    if (role !== 'admin') {
      payload.photo = form.photo;
      payload.phone = form.phone.trim();
      payload.bio = form.bio.trim();
      payload.address = form.address.trim();
      payload.instagram = form.instagram.trim();
      payload.facebook = form.facebook.trim();
      payload.twitter = form.twitter.trim();
      payload.tiktok = form.tiktok.trim();
      payload.youtube = form.youtube.trim();
      payload.linkedin = form.linkedin.trim();
      payload.website = form.website.trim();
      payload.github = form.github.trim();
    }

    if (role === 'guru' && !isSdmGuru) {
      payload.subject = form.subject.trim();
      payload.position = form.position.trim();
      payload.achievements = splitLines(form.achievements);
      payload.certifications = splitLines(form.certifications);
    } else if (role === 'osis') {
      payload.division = form.division.trim();
      payload.position = form.position.trim();
      payload.achievements = splitLines(form.achievements);
      payload.work_programs = splitLines(form.work_programs);
    }

    try {
      const { error } = await myProfileApi.updateProfile(payload);
      if (error) throw new Error(error.message ?? 'Gagal menyimpan profil.');
      await load();
      flash('ok', 'Profil berhasil diperbarui.');
    } catch (err) {
      flash('err', err instanceof Error ? err.message : 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" /></div>;
  }

  const identifiers: { label: string; value: string }[] = [];
  if (profile?.guru?.teacher_id) identifiers.push({ label: 'ID Guru', value: profile.guru.teacher_id });
  if (profile?.guru?.nip) identifiers.push({ label: 'NIP', value: profile.guru.nip });
  if (profile?.guru?.nuptk) identifiers.push({ label: 'NUPTK', value: profile.guru.nuptk });
  if (profile?.osis?.member_id) identifiers.push({ label: 'ID Anggota', value: profile.osis.member_id });
  if (profile?.osis?.nisn) identifiers.push({ label: 'NISN', value: profile.osis.nisn });
  if (profile?.student?.nisn) identifiers.push({ label: 'NISN', value: profile.student.nisn });

  const publicSlug = profile?.guru?.teacher_id
    ? `/profil/guru/${encodeURIComponent(profile.guru.teacher_id)}`
    : profile?.osis?.member_id
      ? `/profil/osis/${encodeURIComponent(profile.osis.member_id)}`
      : profile?.student?.nisn
        ? `/profil/siswa/${encodeURIComponent(profile.student.nisn)}`
        : null;

  const isAdmin = role === 'admin';
  const isSdmGuru = role === 'guru' && !!profile?.guru_sdm;

  return (
    <form onSubmit={save} className="space-y-6">
      {msg && <p className={`rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}

      {!isAdmin && identifiers.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 font-bold text-[#1B2A4A]"><IdCard size={18} className="text-[#866D2C]" /> Identitas Akun</div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {identifiers.map((id) => (
              <div key={id.label}>
                <span className="text-[#5B7088]">{id.label}</span>
                <p className="font-mono font-semibold text-[#1B2A4A]">{id.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[#5B7088]">Identitas ini digunakan untuk login dan halaman profil publik. Tidak dapat diubah sendiri.</p>
          {publicSlug && (
            <a href={publicSlug} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 rounded-lg bg-[#1B2A4A]/5 px-3 py-1.5 text-sm font-semibold text-[#1B2A4A] hover:bg-[#1B2A4A]/10">
              <Globe size={15} className="text-[#866D2C]" /> Lihat halaman profil publik
            </a>
          )}
        </div>
      )}

      {isAdmin ? (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-[#1B2A4A]">Akun Admin</h2>
          <p className="mb-4 text-sm text-[#5B7088]">Admin tidak memiliki profil publik. Anda dapat mengubah username (nama &amp; email login) dan password di sini.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama Lengkap" value={form.name} onChange={setField('name')} />
            <Field label="Email (Username Login)" type="email" value={form.email} onChange={setField('email')} />
          </div>
          <div className="mt-5 flex justify-end">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-6 py-2.5 font-bold text-[#1B2A4A] disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Akun
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-bold text-[#1B2A4A]">Profil</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><ImageField label="Foto Profil" value={form.photo} onChange={(url) => setForm((v) => ({ ...v, photo: url }))} hint="Direkomendasikan foto persegi (1:1)." /></div>
              {isSdmGuru ? (
                <div className="block text-sm font-semibold">
                  Nama Lengkap
                  <div className="mt-1 w-full rounded-lg border border-[#1B2A4A]/20 bg-[#FAF6F0] px-3 py-2 font-normal text-[#1B2A4A]">{form.name}</div>
                  <span className="mt-1 block text-xs font-normal text-[#5B7088]">Nama resmi dari data SDM. Perubahan nama diajukan melalui formulir perubahan data di bawah.</span>
                </div>
              ) : (
                <Field label="Nama Lengkap" value={form.name} onChange={setField('name')} />
              )}
              <Field label="Email" type="email" value={form.email} onChange={setField('email')} />
              <Field label="Nomor Telepon" value={form.phone} onChange={setField('phone')} />
              <div className="sm:col-span-2"><Field label="Bio / Tentang Saya" multiline value={form.bio} onChange={setField('bio')} /></div>
              <div className="sm:col-span-2"><Field label="Alamat (Opsional)" multiline value={form.address} onChange={setField('address')} /></div>
            </div>
          </div>

          {role === 'guru' && (isSdmGuru ? (
            <GuruSdmProfile data={profile.guru_sdm!} />
          ) : (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-bold text-[#1B2A4A]">Data Guru</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Mata Pelajaran" value={form.subject} onChange={setField('subject')} placeholder="cth. Matematika" />
                <Field label="Jabatan (Opsional)" value={form.position} onChange={setField('position')} placeholder="cth. Wali Kelas X TJKT 1" />
                <div className="sm:col-span-2"><Field label="Prestasi" multiline value={form.achievements} onChange={setField('achievements')} hint="Satu prestasi per baris." /></div>
                <div className="sm:col-span-2"><Field label="Sertifikasi" multiline value={form.certifications} onChange={setField('certifications')} hint="Satu sertifikasi per baris." /></div>
              </div>
            </div>
          ))}

          {role === 'osis' && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-bold text-[#1B2A4A]">Data Pengurus OSIS</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Divisi" value={form.division} onChange={setField('division')} placeholder="cth. Divisi Kreativitas" />
                <Field label="Jabatan" value={form.position} onChange={setField('position')} placeholder="cth. Ketua" />
                <div className="sm:col-span-2"><Field label="Prestasi" multiline value={form.achievements} onChange={setField('achievements')} hint="Satu prestasi per baris." /></div>
                <div className="sm:col-span-2"><Field label="Program Kerja" multiline value={form.work_programs} onChange={setField('work_programs')} hint="Satu program kerja per baris." /></div>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-bold text-[#1B2A4A]">Media Sosial</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {SOCIAL_FIELDS.map((field) => (
                <Field key={field.key} label={field.label} value={form[field.key]} onChange={setField(field.key)} placeholder={field.placeholder} />
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#C8A951] px-6 py-2.5 font-bold text-[#1B2A4A] disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Simpan Profil
            </button>
          </div>
        </>
      )}

      <ChangePasswordCard />
    </form>
  );
}

function ChangePasswordCard() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMsg(null);
    if (next.length < 6) {
      setMsg({ type: 'err', text: 'Password baru minimal 6 karakter.' });
      setSaving(false);
      return;
    }
    if (next !== confirm) {
      setMsg({ type: 'err', text: 'Konfirmasi password baru tidak cocok.' });
      setSaving(false);
      return;
    }
    try {
      const { error } = await myProfileApi.updatePassword({ current_password: current, new_password: next });
      if (error) throw new Error(error.message ?? 'Gagal mengubah password.');
      setCurrent('');
      setNext('');
      setConfirm('');
      setMsg({ type: 'ok', text: 'Password berhasil diubah.' });
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Gagal mengubah password.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-[#1B2A4A]"><KeyRound size={18} className="text-[#866D2C]" /> Ubah Password</h2>
      {msg && <p className={`mb-4 rounded-lg p-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Password Saat Ini" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <Field label="Password Baru" type="password" value={next} onChange={(e) => setNext(e.target.value)} />
        <Field label="Ulangi Password Baru" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <div className="flex items-end sm:col-span-2">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2.5 font-bold text-white disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />} Ganti Password
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', multiline = false, hint }: { label: string; value: string; onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; placeholder?: string; type?: string; multiline?: boolean; hint?: string }) {
  const className = 'mt-1 w-full rounded-lg border border-[#1B2A4A]/20 px-3 py-2 font-normal';
  return (
    <label className="block text-sm font-semibold">{label}
      {multiline ? <textarea value={value} onChange={onChange} rows={4} placeholder={placeholder} className={className} /> : <input value={value} type={type} onChange={onChange} placeholder={placeholder} className={className} />}
      {hint && <span className="mt-1 block text-xs font-normal text-[#5B7088]">{hint}</span>}
    </label>
  );
}
