import React, { useEffect, useState } from 'react';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Button } from '../components/ui/Button';
import { LoadingInline } from '../components/ui/LoadingScreen';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  GraduationCap,
  ExternalLink,
  Calendar,
  Info,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { fetchSpmbContent } from '../lib/api';
import {
  type SpmbContent,
  type SpmbFaqItem,
  type SpmbScheduleItem,
} from '../lib/content-types';
import { scheduleCategoryLabels } from '../lib/ui-constants';

function FaqAccordion({ items }: { items: SpmbFaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {items.map((faq, idx) => (
        <div key={idx} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <button
            type="button"
            className="flex w-full items-center justify-between p-4 text-left font-medium text-[#1B2A4A] hover:bg-gray-50 focus:outline-none"
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
          >
            <span className="pr-4 text-lg font-semibold">{faq.question}</span>
            {openIndex === idx ? (
              <ChevronUp className="h-5 w-5 shrink-0 text-[#C8A951]" />
            ) : (
              <ChevronDown className="h-5 w-5 shrink-0 text-[#C8A951]" />
            )}
          </button>
          {openIndex === idx && (
            <div className="border-t border-[#1B2A4A]/10 bg-[#FAF6F0] p-4 text-[#23314D]">{faq.answer}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function FlowStepper({ steps }: { steps: SpmbContent['flow_steps'] }) {
  return (
    <div className="py-4">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="relative rounded-lg border-l-4 border-[#C8A951] bg-white p-6 shadow-sm"
          >
            <div className="mb-2 flex items-center">
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#1B2A4A] font-bold text-[#FAF6F0]">
                {idx + 1}
              </div>
              <h4 className="text-lg font-bold text-[#1B2A4A]">{step.title}</h4>
            </div>
            <p className="ml-11 text-[#23314D]">{step.description}</p>
            {idx < steps.length - 1 && (
              <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-[#C8A951] lg:block" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduleSection({ schedule }: { schedule: SpmbScheduleItem[] }) {
  const grouped = (Object.keys(scheduleCategoryLabels) as SpmbScheduleItem['category'][]).map((category) => ({
    category,
    label: scheduleCategoryLabels[category],
    items: schedule.filter((item) => item.category === category),
  }));

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      {grouped.map(({ category, label, items }) => (
        <div key={category} className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#C8A951]" />
            <h3 className="text-lg font-bold text-[#1B2A4A]">{label}</h3>
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-[#5B7088]">Belum ada jadwal.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="rounded-lg bg-[#1B2A4A] p-4 text-center text-white">
                  <p className="text-xl font-bold text-[#C8A951]">{item.date}</p>
                  <p className="mt-1 font-semibold">{item.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RegisterButton({ content }: { content: SpmbContent }) {
  if (content.status === 'dibuka') {
    return (
      <Button as="link" href={content.portal_url} variant="primary" size="lg" className="px-8 py-4">
        <ExternalLink className="mr-2 h-5 w-5" /> DAFTAR SPMB
      </Button>
    );
  }

  return (
    <div className="inline-flex flex-col items-center gap-3">
      <span className="inline-flex cursor-not-allowed items-center rounded-xl bg-[#1B2A4A]/20 px-8 py-4 text-lg font-semibold text-[#5B7088]">
        <Lock className="mr-2 h-5 w-5" /> Pendaftaran Ditutup
      </span>
      <p className="max-w-md text-sm text-[#E8DCC7]">
        Pendaftaran SPMB saat ini sedang ditutup. Silakan pantau halaman ini untuk informasi pembukaan berikutnya.
      </p>
    </div>
  );
}

const Admissions: React.FC = () => {
  const [content, setContent] = useState<SpmbContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpmbContent().then((data) => {
      setContent(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF6F0]">
        <LoadingInline />
      </div>
    );
  }

  if (!content) return <div className="min-h-screen bg-[#FAF6F0]" />;
  const dummyImage = content.banner_image;

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <section className="relative flex min-h-[250px] w-full items-center bg-[#1B2A4A] text-[#FAF6F0] md:min-h-[320px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${dummyImage})` }}
        />
        <div className="absolute inset-0 bg-[#1B2A4A]/80 bg-gradient-to-r from-[#1B2A4A]/90 to-[#1B2A4A]/60" />
        <div className="container relative z-10 mx-auto px-4 py-10 md:py-16">
          <h1 className="mb-4 text-3xl font-bold text-white md:text-5xl">{content.title}</h1>
          {content.description && (
            <p className="mb-6 max-w-2xl text-lg text-white/80 md:text-xl">{content.description}</p>
          )}
          <nav className="flex text-sm text-[#FAF6F0]" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <a href="/" className="hover:text-[#C8A951] transition-colors">Beranda</a>
              </li>
              <li className="inline-flex items-center">
                <span className="mx-2 text-white/50">/</span>
                <span className="text-[#C8A951] font-medium">SPMB</span>
              </li>
            </ol>
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        {/* Status SPMB */}
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#C8A951]/20 px-4 py-2 text-sm font-semibold text-[#866D2C]">
            <GraduationCap className="h-4 w-4" /> Portal Informasi SPMB
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-medium text-[#5B7088]">
            <span className={`h-2.5 w-2.5 rounded-full ${content.status === 'dibuka' ? 'bg-green-500' : 'bg-red-500'}`} />
            Pendaftaran {content.status === 'dibuka' ? 'Dibuka' : 'Ditutup'}
          </span>
        </div>

        {/* Banner */}
        <div className="mb-12 overflow-hidden rounded-2xl bg-gradient-to-r from-[#1B2A4A] to-[#0C1527] text-white shadow-xl relative">
          <img src={dummyImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1B2A4A]/90 to-[#0C1527]/70" />
          <div className="relative z-10 flex flex-col items-center gap-6 p-8 text-center md:flex-row md:p-10 md:text-left">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#C8A951]/20">
              <GraduationCap className="h-8 w-8 text-[#C8A951]" />
            </div>
            <div className="flex-1">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                <span
                  className={`h-2 w-2 rounded-full ${content.status === 'dibuka' ? 'bg-green-400' : 'bg-red-400'}`}
                />
                Pendaftaran {content.status === 'dibuka' ? 'Dibuka' : 'Ditutup'}
              </div>
              <h3 className="text-xl font-bold text-white">{content.banner_title || content.title}</h3>
              <p className="mt-2 text-[#F3E8D0]">{content.banner_description}</p>
            </div>
            <div className="shrink-0">
              <RegisterButton content={content} />
            </div>
          </div>
        </div>

        {/* Informasi SPMB */}
        <section className="mb-20">
          <SectionHeading title="Informasi SPMB" subtitle="Penjelasan dan informasi pendaftaran terbaru" />
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Info className="h-5 w-5 text-[#C8A951]" />
                <h3 className="text-lg font-bold text-[#1B2A4A]">Tentang SPMB</h3>
              </div>
              <p className="leading-relaxed text-[#23314D]">{content.description}</p>
            </div>
            <div className="rounded-xl border-2 border-[#C8A951]/30 bg-[#C8A951]/5 p-6">
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#866D2C]" />
                <h3 className="text-lg font-bold text-[#1B2A4A]">Informasi Pendaftaran Terbaru</h3>
              </div>
              <p className="leading-relaxed text-[#23314D]">{content.latest_info}</p>
            </div>
          </div>
        </section>

        {/* Persyaratan */}
        <section className="mb-20 rounded-xl bg-white p-8 shadow-sm">
          <SectionHeading title="Persyaratan" subtitle="Dokumen yang perlu disiapkan calon murid" />
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {content.requirements.map((req, i) => (
              <div
                key={i}
                className="flex items-start rounded-lg border border-[#1B2A4A]/10 bg-[#FAF6F0] p-4"
              >
                <CheckCircle2 className="mr-3 mt-0.5 h-6 w-6 shrink-0 text-[#C8A951]" />
                <span className="font-medium text-[#23314D]">{req}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Jadwal */}
        <section className="mb-20">
          <SectionHeading title="Jadwal SPMB" subtitle="Tahapan pendaftaran, seleksi, pengumuman, dan daftar ulang" center />
          <div className="mt-10">
            <ScheduleSection schedule={content.schedule} />
          </div>
        </section>

        {/* Alur Pendaftaran */}
        <section className="mb-20">
          <SectionHeading title="Alur Pendaftaran" subtitle="Langkah-langkah pendaftaran melalui portal resmi SPMB" />
          <FlowStepper steps={content.flow_steps} />
        </section>

        {/* FAQ */}
        <section className="mb-20">
          <SectionHeading title="Tanya Jawab (FAQ)" subtitle="Pertanyaan umum seputar SPMB" center />
          <div className="mx-auto mt-10 max-w-3xl">
            <FaqAccordion items={content.faq} />
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden rounded-2xl bg-[#1B2A4A] text-center text-white">
          <img src={dummyImage} alt="Kegiatan siswa SMKN 11" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0C1527]/60 via-[#1B2A4A]/50 to-[#1B2A4A]/20" />
          <div className="relative z-10 p-12">
            <GraduationCap className="mx-auto mb-4 h-12 w-12 text-[#C8A951]" />
            <h2 className="mb-4 text-3xl font-bold">Siap Bergabung Bersama Kami?</h2>
            <p className="mx-auto mb-8 max-w-2xl text-[#E8DCC7]">
              Daftar melalui portal resmi SPMB Provinsi Banten. Website sekolah hanya menyediakan informasi dan
              pengarahan — seluruh proses pendaftaran dilakukan di portal pemerintah.
            </p>
            <RegisterButton content={content} />
            {content.status === 'dibuka' && (
              <p className="mt-4 text-sm text-[#E8DCC7]">
                Anda akan diarahkan ke{' '}
                <a
                  href={content.portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#C8A951] hover:underline"
                >
                  portal resmi SPMB Banten
                </a>
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Admissions;
