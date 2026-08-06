import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import PageHero from '../../components/ui/PageHero';
import { programs } from '../../data/programs';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { fetchPublicContent, resolveImageUrl } from '../../lib/api';

const StudyPrograms: React.FC = () => {
  const [items, setItems] = React.useState(programs);
  React.useEffect(() => { fetchPublicContent('programs', programs).then(setItems); }, []);
  return (
    <div className="bg-[#FAF6F0] min-h-screen">
      <PageHero 
        title="Program Keahlian" 
        subtitle="Pilihan program keahlian unggulan untuk masa depan cemerlang" 
        backgroundImage="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=80"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((program) => (
            <Card key={program.id}>
              {program.image && (
                <div className="relative h-48 overflow-hidden">
                  <img src={resolveImageUrl(program.image)} alt={program.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A4A]/70 via-transparent to-transparent" />
                  <span className="absolute right-4 top-4 rounded-full bg-[#C8A951] px-3 py-1 text-xs font-bold text-[#1B2A4A]">
                    {program.shortName}
                  </span>
                </div>
              )}
              <div className="flex flex-col flex-1 p-6">
                <div className="w-16 h-16 bg-[#1B2A4A] rounded-full flex items-center justify-center mb-6">
                  <BookOpen className="w-8 h-8 text-[#C8A951]" />
                </div>
                <h3 className="text-xl font-bold text-[#1B2A4A] mb-3">{program.name}</h3>
                <p className="text-[#23314D] mb-6">{program.shortDescription || program.description}</p>
                <Link to={`/akademik/program/${program.slug}`} className="mt-auto">
                  <Button variant="outline" className="w-full text-[#1B2A4A] border-[#1B2A4A] hover:bg-[#1B2A4A] hover:text-[#FAF6F0]">
                    Pelajari Lebih Lanjut
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <SectionHeading title="Bergabunglah Bersama Kami" subtitle="Mulai langkah pertama Anda menuju karir impian" center />
          <div className="mt-8">
            <Link to="/spmb">
              <Button size="lg" className="bg-[#C8A951] hover:bg-[#b09444] text-[#1B2A4A] font-bold">
                Lihat Informasi SPMB
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyPrograms;
