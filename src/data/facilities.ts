export interface Facility {
  id: string;
  name: string;
  description: string;
  category: string;
  photo: string;
}

export const facilitiesData: Facility[] = [
  {
    id: 'fac-1',
    name: 'Laboratorium Komputer',
    description: 'Terdapat 4 ruang laboratorium komputer yang dilengkapi dengan PC spesifikasi tinggi, AC, dan koneksi internet fiber optik untuk menunjang praktik jurusan TKJ dan RPL.',
    category: 'Akademik',
    photo: '/images/facilities/lab-komputer.jpg'
  },
  {
    id: 'fac-2',
    name: 'Bengkel Otomotif',
    description: 'Fasilitas bengkel luas standar industri yang dilengkapi dengan peralatan servis lengkap, engine stand, car lift, dan scanner EFI untuk siswa TKR dan TBSM.',
    category: 'Akademik',
    photo: '/images/facilities/bengkel.jpg'
  },
  {
    id: 'fac-3',
    name: 'Perpustakaan Digital',
    description: 'Ruang baca yang nyaman, koleksi buku cetak, serta fasilitas akses e-book dan jurnal online untuk referensi belajar siswa.',
    category: 'Akademik',
    photo: '/images/facilities/perpustakaan.jpg'
  },
  {
    id: 'fac-4',
    name: 'Lapangan Olahraga Utama',
    description: 'Lapangan serbaguna yang dapat digunakan untuk kegiatan olahraga seperti futsal, basket, voli, dan lapangan upacara bendera.',
    category: 'Fasilitas Umum',
    photo: '/images/facilities/lapangan.jpg'
  },
  {
    id: 'fac-5',
    name: 'Masjid Ulil Albab',
    description: 'Masjid sekolah yang luas dan bersih untuk memfasilitasi ibadah warga sekolah, kegiatan keputrian, dan pembinaan rohani Islam.',
    category: 'Keagamaan',
    photo: '/images/facilities/masjid.jpg'
  },
  {
    id: 'fac-6',
    name: 'Aula Serbaguna',
    description: 'Gedung aula berkapasitas 500 orang yang digunakan untuk pertemuan orang tua, seminar, pentas seni, dan perpisahan sekolah.',
    category: 'Fasilitas Umum',
    photo: '/images/facilities/aula.jpg'
  },
  {
    id: 'fac-7',
    name: 'Laboratorium Akuntansi (Bank Mini)',
    description: 'Ruang praktik bagi jurusan AKL yang didesain menyerupai pelayanan teller bank (Bank Mini) dan dilengkapi dengan mesin hitung uang serta software akuntansi.',
    category: 'Akademik',
    photo: '/images/facilities/lab-akuntansi.jpg'
  },
  {
    id: 'fac-8',
    name: 'Ruang Multimedia & Podcast',
    description: 'Ruangan kedap suara yang dilengkapi perangkat rekaman audio visual terkini untuk memproduksi konten edukasi, siaran sekolah, dan ekskul jurnalistik.',
    category: 'Pendukung',
    photo: '/images/facilities/multimedia.jpg'
  }
];

export { facilitiesData as facilities };
