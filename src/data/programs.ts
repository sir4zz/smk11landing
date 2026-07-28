export interface Program {
  id: string;
  name: string;
  slug: string;
  shortName: string;
  icon: string;
  image?: string;
  description: string;
  shortDescription: string;
  competencies: string[];
  careerProspects: string[];
  facilities: string[];
}

export const programsData: Program[] = [
  {
    id: 'tkj',
    name: 'Teknik Jaringan Komputer dan Telekomunikasi',
    slug: 'tkj',
    shortName: 'TJKT',
    icon: 'Network',
    image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80',
    description: 'Program keahlian Teknik Jaringan Komputer dan Telekomunikasi (TJKT) membekali siswa dengan keterampilan dalam perakitan komputer, instalasi jaringan lokal (LAN) maupun luas (WAN), administrasi server, serta teknologi telekomunikasi. Lulusan dipersiapkan untuk menjadi teknisi jaringan, administrator sistem, dan tenaga ahli di bidang infrastruktur TI dan telekomunikasi.',
    shortDescription: 'Mempelajari perakitan komputer, instalasi jaringan, administrasi server, dan teknologi telekomunikasi.',
    competencies: [
      'Perakitan dan Perbaikan Komputer',
      'Instalasi Jaringan (LAN/WAN)',
      'Administrasi Server (Windows/Linux)',
      'Keamanan Jaringan dan Cyber Security',
      'Teknologi Telekomunikasi dan Fiber Optik',
      'Troubleshooting Perangkat Keras dan Jaringan'
    ],
    careerProspects: [
      'Network Administrator',
      'System Administrator',
      'Teknisi Jaringan Telekomunikasi',
      'IT Support/Technician',
      'Teknisi Fiber Optik',
      'Wirausaha di bidang IT'
    ],
    facilities: [
      'Laboratorium Komputer',
      'Peralatan Jaringan (Router, Switch, MikroTik)',
      'Server Khusus Praktik',
      'Koneksi Internet Fiber Optik',
      'Toolkit Perbaikan Komputer'
    ]
  },
  {
    id: 'dkv',
    name: 'Desain Komunikasi Visual',
    slug: 'dkv',
    shortName: 'DKV',
    icon: 'Code',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=80',
    description: 'Desain Komunikasi Visual (DKV) fokus pada pengembangan kreativitas di bidang desain grafis, multimedia, videografi, fotografi, dan animasi. Siswa akan mempelajari berbagai perangkat lunak desain, teknik fotografi, produksi video, dan pengembangan konten digital kreatif.',
    shortDescription: 'Mempelajari desain grafis, multimedia, videografi, fotografi, dan animasi digital.',
    competencies: [
      'Desain Grafis (CorelDRAW, Adobe Illustrator, Photoshop)',
      'Videografi dan Editing Video (Premiere, After Effects)',
      'Fotografi Digital',
      'Animasi 2D dan 3D',
      'Pengembangan Web & UI/UX Design',
      'Produksi Konten Digital Kreatif'
    ],
    careerProspects: [
      'Desainer Grafis',
      'Videografer / Editor Video',
      'Fotografer',
      'Animator',
      'Social Media Specialist',
      'UI/UX Designer'
    ],
    facilities: [
      'Laboratorium Multimedia',
      'Kamera DSLR/Mirrorless',
      'Studio Fotografi',
      'Green Screen Studio',
      'Komputer Spesifikasi Tinggi untuk Desain'
    ]
  },
  {
    id: 'otomotif',
    name: 'Teknik Otomotif',
    slug: 'otomotif',
    shortName: 'TO',
    icon: 'Car',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80',
    description: 'Teknik Otomotif mendidik siswa untuk memiliki keahlian dalam perawatan dan perbaikan kendaraan roda empat dan roda dua. Program ini mencakup pemahaman mendalam tentang mesin bensin dan diesel, sistem kelistrikan otomotif, sistem injeksi, serta sistem sasis dan pemindah tenaga.',
    shortDescription: 'Fokus pada perawatan dan perbaikan kendaraan bermotor roda dua dan roda empat.',
    competencies: [
      'Pemeliharaan Mesin Kendaraan Ringan',
      'Perbaikan Sistem Kelistrikan Kendaraan',
      'Perawatan Sistem Sasis dan Pemindah Tenaga',
      'Overhaul Mesin',
      'Teknologi Injeksi (EFI & PGM-FI)',
      'Spooring dan Balancing'
    ],
    careerProspects: [
      'Mekanik Profesional',
      'Service Advisor',
      'Teknisi Bengkel Resmi (Dealer)',
      'Wirausaha Bengkel',
      'Operator Industri Otomotif',
      'Kepala Mekanik'
    ],
    facilities: [
      'Bengkel Otomotif Standar Industri',
      'Engine Stand',
      'Car Lift',
      'Alat Uji Emisi',
      'Scanner EFI',
      'Unit Sepeda Motor Berbagai Tipe'
    ]
  },
  {
    id: 'titl',
    name: 'Teknik Ketenagalistrikan',
    slug: 'titl',
    shortName: 'TITL',
    icon: 'Zap',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=900&q=80',
    description: 'Teknik Ketenagalistrikan (TITL) membekali siswa dengan kompetensi di bidang instalasi listrik, sistem tenaga listrik, motor listrik, dan kendali otomasi industri. Lulusan siap bekerja di sektor kelistrikan, perawatan gedung, dan industri manufaktur.',
    shortDescription: 'Mempelajari instalasi listrik, sistem tenaga, motor listrik, dan otomasi industri.',
    competencies: [
      'Instalasi Listrik Penerangan dan Tenaga',
      'Sistem Distribusi Tenaga Listrik',
      'Motor Listrik dan Kontrol',
      'PLC (Programmable Logic Controller)',
      'Elektronika Daya',
      'Instalasi Panel Listrik'
    ],
    careerProspects: [
      'Teknisi Listrik',
      'Instalatir Listrik',
      'Teknisi Pemeliharaan Gedung',
      'Operator Pembangkit Listrik',
      'Wirausaha Jasa Instalasi Listrik',
      'Staf Teknik di Perusahaan Manufaktur'
    ],
    facilities: [
      'Laboratorium Instalasi Listrik',
      'Panel Listrik Praktik',
      'Motor Listrik Berbagai Jenis',
      'Trainer PLC',
      'Peralatan Keselamatan Kerja (K3)'
    ]
  },
  {
    id: 'mplb',
    name: 'Manajemen Perkantoran dan Layanan Bisnis',
    slug: 'mplb',
    shortName: 'MPLB',
    icon: 'Calculator',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80',
    description: 'Manajemen Perkantoran dan Layanan Bisnis (MPLB) membekali siswa dengan kompetensi dalam mengelola administrasi perkantoran, kemampuan komunikasi bisnis, pengelolaan keuangan, dan pengoperasian aplikasi komputer perkantoran. Lulusan siap bekerja di sektor perkantoran, perbankan, dan perusahaan jasa.',
    shortDescription: 'Mempelajari administrasi perkantoran, manajemen bisnis, dan layanan profesional.',
    competencies: [
      'Administrasi dan Manajemen Perkantoran',
      'Komunikasi Bisnis',
      'Kearsipan Digital',
      'Komputer Akuntansi',
      'Public Relation dan Layanan Pelanggan',
      'Kewirausahaan'
    ],
    careerProspects: [
      'Staf Administrasi Perkantoran',
      'Customer Service Representative',
      'Administrasi Keuangan',
      'Resepsionis',
      'Administrasi Personalia (HR)',
      'Wirausaha Jasa Perkantoran'
    ],
    facilities: [
      'Laboratorium Administrasi Perkantoran',
      'Bank Mini',
      'Perangkat Multimedia',
      'Software Administrasi Perkantoran'
    ]
  },
  {
    id: 'busana',
    name: 'Busana',
    slug: 'busana',
    shortName: 'Busana',
    icon: 'Scissors',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80',
    description: 'Program keahlian Busana membekali siswa dengan keterampilan di bidang desain busana, pembuatan pola, menjahit, dan produksi busana. Siswa juga dibekali pengetahuan kewirausahaan untuk mengelola butik atau industri fashion skala kecil dan menengah.',
    shortDescription: 'Mempelajari desain busana, pembuatan pola, menjahit, dan produksi fashion.',
    competencies: [
      'Desain Busana (Fashion Design)',
      'Pembuatan Pola (Pattern Making)',
      'Menjahit (Busana Pria/Wanita/Anak)',
      'Teknik Hiasan Busana (Embroidery, Beading)',
      'Manajemen Produksi Busana',
      'Kewirausahaan Bidang Fashion'
    ],
    careerProspects: [
      'Desainer Busana',
      'Penjahit Profesional',
      'Pattern Maker',
      'Pemilik Butik / Konveksi',
      'Quality Control Produk Garmen',
      'Konsultan Fashion'
    ],
    facilities: [
      'Ruang Praktik Menjahit',
      'Mesin Jahit Industri',
      'Mesin Obras dan Neci',
      'Manekin (Dress Form)',
      'Laboratorium Desain Busana',
      'Peralatan Pembuatan Pola'
    ]
  }
];

export { programsData as programs };
