import React from 'react';
import PageHero from '../../components/ui/PageHero';
import { ShieldCheck, Lightbulb, Users, Award } from 'lucide-react';

const missions = [
  "Menyelenggarakan pendidikan dan pelatihan kejuruan yang berkualitas sesuai dengan standar industri.",
  "Mengembangkan kemitraan strategis dengan Dunia Usaha dan Dunia Industri (DUDI) untuk sinkronisasi kurikulum dan penyaluran lulusan.",
  "Menanamkan nilai-nilai karakter, kedisiplinan, dan etika kerja yang kuat pada seluruh peserta didik.",
  "Meningkatkan kompetensi pendidik dan tenaga kependidikan secara berkelanjutan.",
  "Menyediakan fasilitas dan lingkungan belajar yang aman, nyaman, dan berbasis teknologi.",
  "Mendorong inovasi dan kewirausahaan di kalangan peserta didik."
];

const values = [
  { icon: ShieldCheck, title: "Integritas", description: "Menjunjung tinggi kejujuran dan tanggung jawab dalam setiap tindakan." },
  { icon: Lightbulb, title: "Inovasi", description: "Terus berkreasi dan beradaptasi dengan perkembangan teknologi." },
  { icon: Users, title: "Kolaborasi", description: "Bekerja sama dalam harmoni untuk mencapai tujuan bersama." },
  { icon: Award, title: "Keunggulan", description: "Berkomitmen memberikan kualitas terbaik dalam pendidikan." }
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
          <div className="bg-[#1B2A4A] text-[#FAF6F0] rounded-2xl p-10 md:p-16 text-center shadow-lg">
            <h2 className="text-3xl md:text-4xl font-bold text-[#C8A951] mb-8 uppercase tracking-wider">Visi</h2>
            <p className="text-xl md:text-2xl text-white leading-relaxed font-medium">
              "Menjadi lembaga pendidikan kejuruan yang unggul, inovatif, dan menghasilkan lulusan berkarakter, kompeten, serta berdaya saing di tingkat nasional dan global."
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
              <div key={index} className="bg-white p-8 rounded-lg shadow-sm text-center flex flex-col items-center hover:shadow-md transition-shadow">
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
