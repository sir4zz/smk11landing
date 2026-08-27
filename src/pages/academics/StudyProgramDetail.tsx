import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, Briefcase, Building, ArrowLeft, BookOpen } from 'lucide-react';
import PageHero from '../../components/ui/PageHero';
import type { Program } from '../../lib/content-types';
import { fetchPublicContentByIdResult, resolveImageUrl } from '../../lib/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { SkeletonDetail } from '../../components/ui/Skeleton';

const StudyProgramDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'kompetensi' | 'karir' | 'fasilitas'>('overview');

  useEffect(() => {
    setProgram(null);
    setLoading(true);
    setError(null);
    if (!slug) {
      setLoading(false);
      return;
    }

    fetchPublicContentByIdResult<Program>('programs', slug)
      .then(({ data, error: responseError }) => {
        setProgram(data);
        setError(responseError?.message ?? null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen bg-[#FAF6F0]"><PageHero title="Program Keahlian" /><SkeletonDetail /></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold text-[#1B2A4A] mb-4">Gagal Memuat Program</h1>
        <p className="text-[#23314D] mb-8">{error}</p>
        <Link to="/akademik/program-keahlian">
          <Button className="bg-[#1B2A4A] text-[#FAF6F0] hover:bg-[#15203a]">
            Kembali ke Daftar Program
          </Button>
        </Link>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold text-[#1B2A4A] mb-4">404 - Program Tidak Ditemukan</h1>
        <p className="text-[#23314D] mb-8">Maaf, program keahlian yang Anda cari tidak tersedia.</p>
        <Link to="/akademik/program-keahlian">
          <Button className="bg-[#1B2A4A] text-[#FAF6F0] hover:bg-[#15203a]">
            Kembali ke Daftar Program
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF6F0] min-h-screen">
      <PageHero title={program.name} subtitle="Jelajahi kompetensi dan peluang karir di bidang ini" backgroundImage={resolveImageUrl(program.image ?? '')} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link to="/akademik/program-keahlian" className="inline-flex items-center text-[#1B2A4A] hover:text-[#866D2C] mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Kembali ke Daftar Program
        </Link>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            {/* Tabs */}
            <div className="flex flex-wrap border-b border-gray-300 mb-8">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-6 font-medium transition-colors border-b-2 ${activeTab === 'overview' ? 'border-[#C8A951] text-[#1B2A4A]' : 'border-transparent text-[#5B7088] hover:text-[#1B2A4A]'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('kompetensi')}
                className={`py-3 px-6 font-medium transition-colors border-b-2 ${activeTab === 'kompetensi' ? 'border-[#C8A951] text-[#1B2A4A]' : 'border-transparent text-[#5B7088] hover:text-[#1B2A4A]'}`}
              >
                Kompetensi
              </button>
              <button 
                onClick={() => setActiveTab('karir')}
                className={`py-3 px-6 font-medium transition-colors border-b-2 ${activeTab === 'karir' ? 'border-[#C8A951] text-[#1B2A4A]' : 'border-transparent text-[#5B7088] hover:text-[#1B2A4A]'}`}
              >
                Prospek Karir
              </button>
              <button 
                onClick={() => setActiveTab('fasilitas')}
                className={`py-3 px-6 font-medium transition-colors border-b-2 ${activeTab === 'fasilitas' ? 'border-[#C8A951] text-[#1B2A4A]' : 'border-transparent text-[#5B7088] hover:text-[#1B2A4A]'}`}
              >
                Fasilitas
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="bg-white p-8 rounded-lg shadow-sm">
              {activeTab === 'overview' && (
                <div>
                  <h2 className="text-2xl font-bold text-[#1B2A4A] mb-4">Tentang {program.name}</h2>
                  <p className="text-[#23314D] leading-relaxed whitespace-pre-line">{program.description || program.shortDescription}</p>
                </div>
              )}
              
              {activeTab === 'kompetensi' && (
                <div>
                  <h2 className="text-2xl font-bold text-[#1B2A4A] mb-6">Kompetensi Lulusan</h2>
                  <ul className="space-y-4">
                    {(program.competencies ?? []).map((comp, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="w-6 h-6 text-[#C8A951] mr-3 shrink-0" />
                        <span className="text-[#23314D]">{comp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {activeTab === 'karir' && (
                <div>
                  <h2 className="text-2xl font-bold text-[#1B2A4A] mb-6">Prospek Karir</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(program.careerProspects ?? []).map((career, idx) => (
                      <div key={idx} className="flex items-center bg-[#FAF6F0] p-4 rounded-lg">
                        <Briefcase className="w-5 h-5 text-[#C8A951] mr-3" />
                        <span className="font-medium text-[#1B2A4A]">{career}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {activeTab === 'fasilitas' && (
                <div>
                  <h2 className="text-2xl font-bold text-[#1B2A4A] mb-6">Fasilitas Pendukung</h2>
                  <ul className="space-y-4">
                    {(program.facilities ?? []).map((fas, idx) => (
                      <li key={idx} className="flex items-center bg-[#FAF6F0] p-4 rounded-lg">
                        <Building className="w-5 h-5 text-[#C8A951] mr-3" />
                        <span className="font-medium text-[#1B2A4A]">{fas}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          <div className="lg:w-1/3">
            <Card className="sticky top-8 !bg-[#1B2A4A] text-[#FAF6F0]">
              <div className="p-8">
                <div className="mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-[#FAF6F0]">
                  {program.logo && resolveImageUrl(program.logo) ? (
                    <img src={resolveImageUrl(program.logo)!} alt={`Logo ${program.name}`} className="h-full w-full object-contain p-1.5" />
                  ) : (
                    <BookOpen className="h-9 w-9 text-[#1B2A4A]" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-[#C8A951] mb-4">{program.name}</h3>
                <p className="text-[#F3E8D0] mb-8">{program.shortDescription}</p>
                
                <div className="space-y-4 border-t border-gray-600 pt-6">
                  <h4 className="font-semibold text-lg text-white">Tertarik dengan program ini?</h4>
                  <p className="text-sm text-[#E8DCC7]">Daftar sekarang melalui portal PPDB online kami.</p>
                  <Link to="/spmb" className="block mt-4">
                    <Button className="w-full bg-[#C8A951] hover:bg-[#b09444] text-[#1B2A4A] font-bold">
                      Daftar Sekarang
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyProgramDetail;
