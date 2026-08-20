import React from 'react';
import PageHero from '../../components/ui/PageHero';

const milestones = [
  { year: '2013', title: 'Pendirian SMKN 11 Kabupaten Tangerang', description: 'Berdasarkan SK Operasional No. 420/Kep.678-Huk/2013 pada tanggal 5 Oktober 2013, SMKN 11 Kabupaten Tangerang resmi didirikan untuk memenuhi kebutuhan pendidikan kejuruan di wilayah Kecamatan Jayanti dan sekitarnya.' },
  { year: '2014', title: 'Tahun Ajaran Perdana', description: 'Tahun ajaran pertama dimulai dengan membuka beberapa program keahlian. Sekolah menerapkan sistem militer dalam pembinaan siswa, yang kemudian menjadi ciri khas SMKN 11 Kabupaten Tangerang.' },
  { year: '2015', title: 'Pengembangan Program Keahlian', description: 'Melakukan pengembangan dan penambahan program keahlian untuk menjawab kebutuhan industri. Program keahlian yang ada terus dibenahi kurikulumnya agar sesuai dengan standar dunia usaha dan industri.' },
  { year: '2016', title: 'Peningkatan Kualitas Pembelajaran', description: 'Mengembangkan model pembelajaran berbasis ICT dan mulai membangun infrastruktur teknologi informasi untuk mendukung proses belajar mengajar yang modern.' },
  { year: '2017', title: 'Penambahan Sarana dan Prasarana', description: 'Melakukan pembangunan dan renovasi sarana prasarana sekolah termasuk laboratorium komputer, bengkel otomotif, dan fasilitas pendukung pembelajaran lainnya.' },
  { year: '2018', title: 'Akreditasi B', description: 'Meraih akreditasi B berdasarkan SK No. 039/BAN-SM-Prov/SK/2018 dari Badan Akreditasi Nasional Sekolah/Madrasah (BAN-S/M) pada tanggal 12 Desember 2018.' },
  { year: '2019', title: 'Kegiatan Keagamaan dan Sosial', description: 'Menyelenggarakan peringatan Maulid Nabi Muhammad SAW yang melibatkan seluruh siswa, guru, dan masyarakat sekitar. Kegiatan ini menjadi agenda tahunan untuk membentuk akhlakul karimah siswa.' },
  { year: '2020', title: 'Adaptasi Pembelajaran Daring', description: 'Menerapkan sistem pembelajaran daring yang efektif selama masa pandemi global. Sekolah berhasil beradaptasi dengan cepat menggunakan platform digital untuk kelangsungan pendidikan.' },
  { year: '2022', title: 'Pembaruan Kurikulum', description: 'Melakukan transisi dan pembaruan kurikulum menuju Kurikulum Merdeka dengan penataan ulang program keahlian sesuai kebutuhan industri modern.' },
  { year: '2024', title: 'Inovasi dan Prestasi Berkelanjutan', description: 'Terus berinovasi dalam layanan pendidikan dan meraih berbagai prestasi di ajang Lomba Kompetensi Siswa (LKS) tingkat Kabupaten dan Provinsi Banten.' },
];

const History: React.FC = () => {
  return (
    <main className="bg-[#FAF6F0] min-h-screen">
      <PageHero 
        title="Sejarah Sekolah" 
        subtitle="Mengenal perjalanan panjang SMKN 11 Kabupaten Tangerang" 
        backgroundImage="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1600&q=80"
      />
      <section className="py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="relative border-l-4 border-[#1B2A4A] ml-4 md:ml-6">
          {milestones.map((milestone, index) => (
            <div key={index} className="mb-8 md:mb-10 ml-6 md:ml-12 relative group">
              <span className="absolute -left-[38px] md:-left-[58px] top-1 h-5 w-5 md:h-6 md:w-6 rounded-full bg-[#C8A951] border-3 md:border-4 border-[#FAF6F0]" />
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100 transition duration-300 hover:shadow-md">
                <span className="inline-block text-[#866D2C] font-bold text-base sm:text-lg mb-2">{milestone.year}</span>
                <h3 className="text-lg sm:text-xl font-semibold text-[#1B2A4A] mb-2">{milestone.title}</h3>
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
