export interface Extracurricular {
  id: string;
  name: string;
  description: string;
  category: string;
  photo: string;
  advisor: string;
  meetingDay: string;
}

export const extracurricularsData: Extracurricular[] = [
  {
    id: 'eks-1',
    name: 'Paskibra Satria 11',
    description: 'Pasukan Pengibar Bendera yang melatih kedisiplinan, kekompakan, dan jiwa nasionalisme melalui latihan baris-berbaris dan tata upacara bendera.',
    category: 'Kedisiplinan',
    photo: 'https://images.unsplash.com/photo-1526976668913-0b7520b8c12d?auto=format&fit=crop&w=900&q=80',
    advisor: 'Aiptu Hendra Gunawan',
    meetingDay: 'Jumat & Sabtu'
  },
  {
    id: 'eks-2',
    name: 'Futsal',
    description: 'Wadah pengembangan bakat olahraga futsal yang telah menorehkan berbagai prestasi di tingkat kabupaten dan provinsi.',
    category: 'Olahraga',
    photo: 'https://images.unsplash.com/photo-1552664688-cf1ec3b78476?auto=format&fit=crop&w=900&q=80',
    advisor: 'Pak Rahmat Hidayat',
    meetingDay: 'Selasa & Kamis'
  },
  {
    id: 'eks-3',
    name: 'Basket',
    description: 'Ekstrakurikuler bola basket yang mengedepankan kerja sama tim, ketangkasan, dan sportivitas dalam setiap pertandingan.',
    category: 'Olahraga',
    photo: 'https://images.unsplash.com/photo-1574623452339-5e2b0dc96d8f?auto=format&fit=crop&w=900&q=80',
    advisor: 'Pak Dede Supriyadi',
    meetingDay: 'Senin & Rabu'
  },
  {
    id: 'eks-4',
    name: 'Rohis (Rohani Islam)',
    description: 'Kegiatan kerohanian Islam yang bertujuan memperkuat iman, akhlak mulia, dan wawasan keislaman siswa melalui kajian, mentoring, dan kegiatan sosial.',
    category: 'Keagamaan',
    photo: 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?auto=format&fit=crop&w=900&q=80',
    advisor: 'Bu Aisyah S.Pd.I',
    meetingDay: 'Jumat'
  },
  {
    id: 'eks-5',
    name: 'PMR (Palang Merah Remaja)',
    description: 'Organisasi kepalangmerahan yang melatih siswa menjadi relawan tanggap darurat, pertolongan pertama, dan donor darah.',
    category: 'Sosial',
    photo: 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=900&q=80',
    advisor: 'Bu Dewi Sartika',
    meetingDay: 'Sabtu'
  },
  {
    id: 'eks-6',
    name: 'Pramuka',
    description: 'Kegiatan kepanduan yang membentuk karakter, kemandirian, dan jiwa kepemimpinan melalui berbagai kegiatan outdoor dan keterampilan.',
    category: 'Kedisiplinan',
    photo: 'https://images.unsplash.com/photo-1521185496952-571e42c3f5b0?auto=format&fit=crop&w=900&q=80',
    advisor: 'Pak Sutrisno',
    meetingDay: 'Jumat'
  },
  {
    id: 'eks-7',
    name: 'Jurnalistik & Multimedia',
    description: 'Wadah pengembangan minat di bidang penulisan, fotografi, videografi, dan produksi konten digital untuk publikasi sekolah.',
    category: 'Seni & Kreatif',
    photo: 'https://images.unsplash.com/photo-1574717024653-61f18dee1fb0?auto=format&fit=crop&w=900&q=80',
    advisor: 'Pak Wahyu Nugroho',
    meetingDay: 'Rabu'
  },
  {
    id: 'eks-8',
    name: 'Seni Tari & Musik',
    description: 'Eksplorasi bakat seni tari tradisional dan modern, serta musik, yang sering tampil pada acara-acara sekolah dan lomba kebudayaan.',
    category: 'Seni & Kreatif',
    photo: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
    advisor: 'Bu Rina Marlina',
    meetingDay: 'Kamis'
  },
  {
    id: 'eks-9',
    name: 'English Club',
    description: 'Klub percakapan bahasa Inggris yang meningkatkan kemampuan speaking, listening, dan public speaking melalui debat, storytelling, dan diskusi.',
    category: 'Akademik',
    photo: 'https://images.unsplash.com/photo-1582656894606-c1c9e6ef015d?auto=format&fit=crop&w=900&q=80',
    advisor: 'Bu Nani Kusmawati',
    meetingDay: 'Selasa'
  },
  {
    id: 'eks-10',
    name: 'Taekwondo',
    description: 'Latihan bela diri taekwondo untuk mengembangkan kesehatan fisik, disiplin, dan kemampuan bela diri dengan pembinaan berjenjang.',
    category: 'Olahraga',
    photo: 'https://images.unsplash.com/photo-1576200962002-b08bab9ca72f?auto=format&fit=crop&w=900&q=80',
    advisor: 'Pak Agus Salim',
    meetingDay: 'Kamis & Sabtu'
  }
];

export { extracurricularsData as extracurriculars };
