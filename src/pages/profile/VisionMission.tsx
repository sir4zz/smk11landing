import React from 'react';
import PageHero from '../../components/ui/PageHero';
import { ShieldCheck, Lightbulb, Users, Award } from 'lucide-react';

const missions = [
  "Mewujudkan sarana-prasarana belajar sesuai standar Nasional.",
  "Mewujudkan Manajemen berbasis Sekolah dan ICT.",
  "Mewujudkan Pembelajaran yang berstandar Nasional.",
  "Mewujudkan lulusan yang religius."
];

const values = [
  { icon: ShieldCheck, title: "Integritas", description: "Menjunjung tinggi kejujuran, tanggung jawab, dan akhlakul karimah dalam setiap tindakan." },
  { icon: Lightbulb, title: "Inovasi", description: "Terus berkreasi dan beradaptasi dengan perkembangan teknologi dan industri." },
  { icon: Users, title: "Kolaborasi", description: "Membangun kemitraan dengan dunia usaha, industri, dan masyarakat." },
  { icon: Award, title: "Keunggulan", description: "Berorientasi pada mutu dan kualitas layanan pendidikan yang unggul." }
];

const VisionMission: React.FC = () => {
  return (
    <main className="bg-[#FAF6F0] min-h-screen">
      <PageHero 
        title="Visi & Misi" 
        subtitle="Arah dan tujuan pendidikan SMKN 11 Kabupaten Tangerang" 
        backgroundImage="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80"
      />
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-20">
          <div className="bg-[#1B2A4A] text-[#FAF6F0] rounded-2xl p-6 sm:p-10 md:p-16 text-center shadow-lg">
            <h2 className="text-3xl md:text-4xl font-bold text-[#C8A951] mb-8 uppercase tracking-wider">Visi</h2>
            <p className="text-xl md:text-2xl text-white leading-relaxed font-medium">
              "Terselenggaranya layanan prima pendidikan Menengah Kejuruan dalam membentuk kelulusan SMK Negeri 11 Kab. Tangerang yang berakhlaqul karimah, disiplin, mandiri, dan terampil, berjiwa kewirausahaan, siap kerja, memiliki kepribadian bangsa yang mampu mengembangkan keunggulan lokal."
            </p>
          </div>
        </div>

        <div className="mb-20">
          <h2 className="text-3xl font-bold text-[#1B2A4A] text-center mb-12">Misi Sekolah</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {missions.map((mission, index) => (
              <div key={index} className="flex items-start bg-white p-6 rounded-lg shadow-sm">
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-[#C8A951] text-white font-bold text-lg mr-4">
                  {index + 1}
                </div>
                <p className="text-[#23314D] leading-relaxed pt-1">
                  {mission}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-[#1B2A4A] text-center mb-12">Nilai Inti</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white p-6 sm:p-8 rounded-lg shadow-sm text-center flex flex-col items-center hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-full bg-[#FAF6F0] text-[#C8A951] flex items-center justify-center mb-6">
                  <value.icon size={32} />
                </div>
                <h3 className="text-xl font-bold text-[#1B2A4A] mb-3">{value.title}</h3>
                <p className="text-[#23314D]">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default VisionMission;
