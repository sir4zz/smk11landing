import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/ui/PageHero';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Button } from '../components/ui/Button';
import { ChevronDown, ChevronUp, CheckCircle2, GraduationCap, UserPlus, LogIn, ArrowRight } from 'lucide-react';
import { apiUrl } from '../lib/api';

const Stepper: React.FC = () => {
  const steps = [
    { title: 'Registrasi Online', desc: 'Isi formulir pendaftaran melalui website' },
    { title: 'Unggah Dokumen', desc: 'Upload persyaratan administrasi' },
    { title: 'Verifikasi Berkas', desc: 'Pengecekan dokumen oleh panitia' },
    { title: 'Tes Seleksi', desc: 'Tes akademik dan wawancara' },
    { title: 'Pengumuman', desc: 'Hasil seleksi diumumkan' },
    { title: 'Daftar Ulang', desc: 'Registrasi fisik dan pembayaran' }
  ];

  return (
    <div className="py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {steps.map((step, idx) => (
          <div key={idx} className="relative bg-white p-6 rounded-lg shadow-sm border-l-4 border-[#C8A951]">
            <div className="flex items-center mb-2">
              <div className="bg-[#1B2A4A] text-[#FAF6F0] w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">
                {idx + 1}
              </div>
              <h4 className="font-bold text-[#1B2A4A] text-lg">{step.title}</h4>
            </div>
            <p className="text-[#23314D] ml-11">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const Accordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  const faqs = [
    { q: 'Kapan pendaftaran PPDB dibuka?', a: 'Pendaftaran gelombang pertama dibuka mulai tanggal 1-30 Juni 2026 melalui website resmi sekolah.' },
    { q: 'Apakah ada tes seleksi masuk?', a: 'Ya, terdapat tes akademik dan wawancara untuk peminatan jurusan yang dilaksanakan pada 5-10 Juli 2026.' },
    { q: 'Dokumen apa saja yang perlu disiapkan?', a: 'Ijazah/SKL, Kartu Keluarga, Akta Kelahiran, Pas Foto, SKHUN, dan Rapor semester 1-5.' },
    { q: 'Berapa biaya pendaftaran?', a: 'Pendaftaran PPDB SMKN 11 tidak dipungut biaya (Gratis). Biaya yang timbul hanya pada saat daftar ulang untuk seragam dan keperluan pribadi siswa.' },
    { q: 'Apakah menerima siswa dari luar daerah?', a: 'Ya, kami menerima siswa dari luar Kabupaten Tangerang dengan kuota jalur zonasi/prestasi yang telah ditentukan dinas pendidikan.' }
  ];

  return (
    <div className="space-y-4">
      {faqs.map((faq, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
          <button 
            className="w-full flex justify-between items-center p-4 text-left font-medium text-[#1B2A4A] hover:bg-gray-50 focus:outline-none"
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
          >
            <span className="font-semibold text-lg">{faq.q}</span>
            {openIndex === idx ? <ChevronUp className="w-5 h-5 text-[#C8A951]" /> : <ChevronDown className="w-5 h-5 text-[#C8A951]" />}
          </button>
          {openIndex === idx && (
            <div className="p-4 bg-[#FAF6F0] border-t border-[#1B2A4A]/10 text-[#23314D]">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const Admissions: React.FC = () => {
  const [formStatus, setFormStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requirements = [
    'Ijazah SMP / Surat Keterangan Lulus (SKL)',
    'Kartu Keluarga (KK)',
    'Akta Kelahiran',
    'Pas Foto Berwarna (3x4)',
    'SKHUN (Surat Keterangan Hasil Ujian Nasional)',
    'Rapor SMP Semester 1 - 5'
  ];

  const submitApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormStatus(null);

    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form) as any);

    try {
      const response = await fetch(apiUrl('/api/ppdb/apply'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      });

      const responseText = await response.text();
      let result: { message?: string } | null = null;

      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch {
          result = null;
        }
      }

      if (!response.ok) {
        throw new Error(result?.message || responseText || 'Pendaftaran gagal dikirim.');
      }

      if (form instanceof HTMLFormElement) {
        form.reset();
      }

      setFormStatus({ type: 'success', message: 'Pendaftaran berhasil dikirim. Panitia akan memverifikasi data Anda.' });
    } catch (error) {
      setFormStatus({ type: 'error', message: error instanceof Error ? error.message : 'Tidak dapat terhubung ke server PPDB.' });
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="bg-[#FAF6F0] min-h-screen">
     <PageHero 
        title="Penerimaan Peserta Didik Baru (PPDB)" 
        subtitle="Informasi lengkap pendaftaran siswa baru SMKN 11 Kabupaten Tangerang" 
        backgroundImage="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">

        {/* Banner Sistem Baru */}
        <div className="mb-12 overflow-hidden rounded-2xl bg-gradient-to-r from-[#1B2A4A] to-[#0C1527] shadow-xl text-white">
          <div className="flex flex-col items-center gap-6 p-8 text-center md:flex-row md:text-left md:p-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#C8A951]/20">
              <GraduationCap className="h-8 w-8 text-[#C8A951]" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">PPDB Online SMKN 11 Kab. Tangerang</h3>
              <p className="mt-1 text-[#F3E8D0]">Daftar sekarang melalui sistem PPDB online. Buat akun, lengkapi data, upload dokumen, dan pantau status pendaftaran secara real-time.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button as="link" href="/ppdb/daftar" variant="primary" size="lg" className="w-full sm:w-auto">
                <UserPlus className="mr-2 h-5 w-5" /> Buat Akun & Daftar
              </Button>
              <Button as="link" href="/ppdb/masuk" variant="outline-light" size="lg" className="w-full sm:w-auto">
                <LogIn className="mr-2 h-5 w-5" /> Sudah Punya Akun
              </Button>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#1B2A4A]">Jadwal PPDB Tahun Ajaran 2026/2027</h2>
            <div className="h-1 w-24 bg-[#C8A951] mx-auto mt-4"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { date: '1-30 Juni 2026', title: 'Pendaftaran Online' },
              { date: '5-10 Juli 2026', title: 'Tes Seleksi' },
              { date: '15 Juli 2026', title: 'Pengumuman' },
              { date: '16-20 Juli 2026', title: 'Daftar Ulang' }
            ].map((item, i) => (
              <div key={i} className="bg-[#1B2A4A] text-center p-6 rounded-lg text-white">
                <p className="text-[#C8A951] font-bold text-xl mb-2">{item.date}</p>
                <h4 className="font-semibold">{item.title}</h4>
              </div>
            ))}
          </div>
        </section>

        {/* Alur Section */}
        <section className="mb-20">
          <SectionHeading title="Alur Pendaftaran" subtitle="Tahapan yang harus dilalui calon siswa" />
          <Stepper />
        </section>

        {/* Requirements Section */}
        <section className="mb-20 bg-white p-8 rounded-lg shadow-sm">
          <SectionHeading title="Persyaratan Dokumen" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            {requirements.map((req, i) => (
              <div key={i} className="flex items-center">
                <CheckCircle2 className="w-6 h-6 text-[#C8A951] mr-3" />
                <span className="text-[#23314D] font-medium">{req}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Sistem Baru */}
        <section className="mb-20 rounded-2xl border-2 border-[#C8A951]/30 bg-[#C8A951]/5 p-8 text-center md:p-12">
          <GraduationCap className="mx-auto mb-4 h-12 w-12 text-[#C8A951]" />
          <h2 className="text-2xl font-bold text-[#1B2A4A] md:text-3xl">Daftar Sekarang via PPDB Online</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[#23314D]">
            Daftar melalui sistem PPDB online kami. Buat akun, lengkapi formulir, upload dokumen, dan pantau status pendaftaran langsung dari dashboard Anda.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button as="link" href="/ppdb/daftar" variant="primary" size="lg" className="px-8 py-4">
              <UserPlus className="mr-2 h-5 w-5" /> Buat Akun & Daftar
            </Button>
            <Button as="link" href="/ppdb/masuk" variant="outline" size="lg" className="px-8 py-4">
              <LogIn className="mr-2 h-5 w-5" /> Masuk ke Akun
            </Button>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-20">
          <SectionHeading title="Tanya Jawab (FAQ)" subtitle="Pertanyaan yang sering diajukan seputar PPDB" center />
          <div className="max-w-3xl mx-auto mt-10">
            <Accordion />
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-[#1B2A4A] rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Siap Bergabung Bersama Kami?</h2>
          <p className="text-[#E8DCC7] mb-8 max-w-2xl mx-auto">
            Jangan lewatkan kesempatan untuk mengembangkan potensi Anda bersama SMKN 11 Kabupaten Tangerang.
          </p>
          <Button as="link" href="/ppdb/daftar" variant="primary" size="lg" className="text-lg px-8 py-4">
            <UserPlus className="mr-2 h-5 w-5 inline" /> Daftar Sekarang
          </Button>
          <p className="mt-4 text-sm text-[#E8DCC7]">
            Sudah punya akun? <Link to="/ppdb/masuk" className="font-semibold text-[#C8A951] hover:underline">Masuk di sini</Link>
          </p>
        </section>

      </div>
    </div>
  );
};

export default Admissions;
