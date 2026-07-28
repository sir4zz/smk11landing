import React from 'react';
import PageHero from '../../components/ui/PageHero';

const milestones = [
  { year: '2015', title: 'Pendirian SMKN 11 Kabupaten Tangerang', description: 'Sekolah resmi didirikan untuk memenuhi kebutuhan pendidikan kejuruan di wilayah Kabupaten Tangerang.' },
  { year: '2016', title: 'Pembukaan program keahlian pertama', description: 'Program keahlian Teknik Komputer dan Jaringan (TKJ) dan Rekayasa Perangkat Lunak (RPL) resmi dibuka.' },
  { year: '2017', title: 'Penambahan program keahlian', description: 'Membuka program Teknik Kendaraan Ringan (TKR) dan Teknik dan Bisnis Sepeda Motor (TBSM).' },
  { year: '2018', title: 'Akreditasi dan penambahan program', description: 'Mendapatkan akreditasi pertama dan membuka program Akuntansi dan Keuangan Lembaga (AKL).' },
  { year: '2019', title: 'Prestasi tingkat kabupaten', description: 'Meraih berbagai prestasi di tingkat kabupaten dalam kompetensi keahlian dan ekstrakurikuler.' },
  { year: '2020', title: 'Adaptasi pembelajaran daring', description: 'Menerapkan sistem pembelajaran daring yang efektif selama masa pandemi global.' },
  { year: '2022', title: 'Renovasi fasilitas', description: 'Peningkatan fasilitas sekolah dan laboratorium praktik untuk menunjang kompetensi siswa.' },
  { year: '2024', title: 'Akreditasi A dan kerjasama industri', description: 'Mencapai akreditasi A dan memperluas jaringan kerjasama dengan berbagai industri ternama.' },
];

const History: React.FC = () => {
  return (
    <main className="bg-[#FAF6F0] min-h-screen">
      <PageHero 
        title="Sejarah Sekolah" 
        subtitle="Mengenal perjalanan panjang SMKN 11 Kabupaten Tangerang" 
        backgroundImage="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1600&q=80"
      />
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="relative border-l-4 border-[#1B2A4A] ml-4 md:ml-6">
          {milestones.map((milestone, index) => (
            <div key={index} className="mb-10 ml-8 md:ml-12 relative group">
              <span className="absolute -left-[42px] md:-left-[58px] top-1 h-6 w-6 rounded-full bg-[#C8A951] border-4 border-[#FAF6F0]" />
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 transition duration-300 hover:shadow-md">
                <span className="inline-block text-[#866D2C] font-bold text-lg mb-2">{milestone.year}</span>
                <h3 className="text-xl font-semibold text-[#1B2A4A] mb-2">{milestone.title}</h3>
                <p className="text-[#23314D] leading-relaxed">{milestone.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default History;
