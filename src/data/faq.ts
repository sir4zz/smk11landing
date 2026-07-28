export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const faqData: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'Apa saja program keahlian yang tersedia di SMKN 11 Kabupaten Tangerang?',
    answer: 'SMKN 11 Kabupaten Tangerang memiliki 6 program keahlian unggulan, yaitu Teknik Jaringan Komputer dan Telekomunikasi (TJKT), Desain Komunikasi Visual (DKV), Teknik Otomotif (TO), Teknik Ketenagalistrikan (TITL), Manajemen Perkantoran dan Layanan Bisnis (MPLB), dan Busana.',
    category: 'Umum'
  },
  {
    id: 'faq-2',
    question: 'Bagaimana cara mendaftar PPDB di SMKN 11?',
    answer: 'Pendaftaran PPDB dilakukan secara online melalui portal resmi PPDB Provinsi Banten. Calon siswa dapat mengakses halaman PPDB di website kami untuk informasi lengkap mengenai jadwal, persyaratan, alur pendaftaran, dan dokumen yang perlu disiapkan.',
    category: 'PPDB'
  },
  {
    id: 'faq-3',
    question: 'Apa saja jalur pendaftaran yang tersedia?',
    answer: 'Terdapat empat jalur pendaftaran: Jalur Zonasi (berdasarkan domisili), Jalur Prestasi (akademik/non-akademik), Jalur Afirmasi (siswa kurang mampu), dan Jalur Perpindahan Tugas Orang Tua.',
    category: 'PPDB'
  },
  {
    id: 'faq-4',
    question: 'Berapa biaya sekolah di SMKN 11 Kabupaten Tangerang?',
    answer: 'SMKN 11 Kabupaten Tangerang adalah sekolah negeri gratis yang tidak memungut biaya SPP. Terdapat biaya sukarela untuk kegiatan tertentu seperti MPLS, praktik, dan kegiatan ekstrakurikuler yang telah disesuaikan dengan kemampuan orang tua siswa.',
    category: 'Umum'
  },
  {
    id: 'faq-5',
    question: 'Apakah SMKN 11 menyediakan beasiswa?',
    answer: 'Ya, sekolah menyediakan program beasiswa bagi siswa berprestasi dan kurang mampu melalui berbagai sumber, seperti Program Indonesia Pintar (PIP), Kartu Tangerang Pintar, dan beasiswa dari dunia usaha/industri mitra sekolah.',
    category: 'Umum'
  },
  {
    id: 'faq-6',
    question: 'Bagaimana peluang kerja lulusan SMKN 11?',
    answer: 'Lulusan SMKN 11 memiliki peluang kerja yang sangat baik karena kurikulum kami selaras dengan kebutuhan industri. Sekolah memiliki kerjasama dengan berbagai DU/DI, BKK (Bursa Kerja Khusus) yang aktif menyalurkan lulusan, dan banyak alumni yang sukses bekerja di perusahaan ternama maupun berwirausaha.',
    category: 'Karir'
  },
  {
    id: 'faq-7',
    question: 'Apakah ada kegiatan ekstrakurikuler di SMKN 11?',
    answer: 'Tentu saja. SMKN 11 memiliki banyak pilihan ekstrakurikuler, antara lain Paskibra, Futsal, Basket, Rohis, PMR, Pramuka, Jurnalistik, Seni Tari & Musik, English Club, dan Taekwondo. Semua ekskul dibina oleh pembina profesional dan berprestasi.',
    category: 'Kesiswaan'
  },
  {
    id: 'faq-8',
    question: 'Bagaimana jam belajar di SMKN 11?',
    answer: 'Kegiatan belajar dimulai pukul 07.00 WIB hingga 15.30 WIB untuk hari Senin hingga Kamis, dan pukul 07.00 hingga 11.30 WIB untuk hari Jumat. Jam praktik di bengkel atau laboratorium disesuaikan dengan jadwal masing-masing jurusan.',
    category: 'Umum'
  },
  {
    id: 'faq-9',
    question: 'Apakah siswa diizinkan membawa kendaraan bermotor ke sekolah?',
    answer: 'Siswa diizinkan membawa kendaraan bermotor dengan syarat memiliki SIM (bagi yang sudah 17 tahun) atau surat izin orang tua, serta mematuhi peraturan parkir dan keselamatan berkendara di lingkungan sekolah.',
    category: 'Kesiswaan'
  },
  {
    id: 'faq-10',
    question: 'Bagaimana cara menghubungi pihak sekolah?',
    answer: 'Anda dapat menghubungi SMKN 11 melalui telepon di nomor yang tertera di halaman Kontak website ini, mengirimkan pesan melalui form kontak di website, atau datang langsung ke alamat sekolah di Kabupaten Tangerang pada jam kerja.',
    category: 'Umum'
  }
];

export { faqData as faq };
