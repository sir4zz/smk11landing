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
    name: 'Teknik Komputer dan Jaringan',
    slug: 'tkj',
    shortName: 'TKJ',
    icon: 'Network',
    image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80',
    description: 'Program keahlian Teknik Komputer dan Jaringan (TKJ) membekali siswa dengan keterampilan dalam perakitan komputer, instalasi jaringan lokal (LAN) maupun luas (WAN), serta administrasi server. Lulusan dipersiapkan untuk menjadi teknisi jaringan, administrator sistem, dan tenaga ahli di bidang infrastruktur TI.',
    shortDescription: 'Mempelajari perakitan komputer, instalasi jaringan, dan administrasi server.',
    competencies: [
      'Perakitan dan Perbaikan Komputer',
      'Instalasi Jaringan (LAN/WAN)',
      'Administrasi Server (Windows/Linux)',
      'Keamanan Jaringan',
      'Troubleshooting Perangkat Keras dan Jaringan'
    ],
    careerProspects: [
      'Network Administrator',
      'System Administrator',
      'IT Support/Technician',
      'Wirausaha di bidang IT',
      'Staf IT Perusahaan'
    ],
    facilities: [
      'Laboratorium Komputer',
      'Peralatan Jaringan (Router, Switch)',
      'Server Khusus Praktik',
      'Koneksi Internet Kecepatan Tinggi'
    ]
  },
  {
    id: 'rpl',
    name: 'Rekayasa Perangkat Lunak',
    slug: 'rpl',
    shortName: 'RPL',
    icon: 'Code',
    image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80',
    description: 'Rekayasa Perangkat Lunak (RPL) fokus pada pengembangan perangkat lunak, mulai dari desain, coding, pengujian, hingga pemeliharaan sistem. Siswa akan mempelajari berbagai bahasa pemrograman, pengembangan web, aplikasi mobile, dan basis data.',
    shortDescription: 'Mempelajari pengembangan aplikasi web, desktop, mobile, dan manajemen basis data.',
    competencies: [
      'Pemrograman Web (HTML, CSS, JS, PHP, Framework)',
      'Pemrograman Berorientasi Objek (Java/C#)',
      'Pengembangan Aplikasi Mobile (Android)',
      'Desain dan Manajemen Basis Data (MySQL/PostgreSQL)',
      'Analisis dan Desain Sistem'
    ],
    careerProspects: [
      'Web Developer',
      'Mobile App Developer',
      'Database Administrator',
      'UI/UX Designer',
      'Software Tester/Quality Assurance'
    ],
    facilities: [
      'Laboratorium Rekayasa Perangkat Lunak',
      'Komputer Spesifikasi Tinggi',
      'Software Development Kit Terkini',
      'Proyektor dan Smart TV untuk Presentasi'
    ]
  },
  {
    id: 'tkr',
    name: 'Teknik Kendaraan Ringan',
    slug: 'tkr',
    shortName: 'TKR',
    icon: 'Car',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80',
    description: 'Teknik Kendaraan Ringan (TKR) mendidik siswa untuk memiliki keahlian dalam perawatan dan perbaikan mesin otomotif roda empat. Program ini mencakup pemahaman mendalam tentang mesin bensin dan diesel, sistem kelistrikan otomotif, serta sistem sasis dan pemindah tenaga.',
    shortDescription: 'Fokus pada perawatan dan perbaikan kendaraan roda empat (mobil).',
    competencies: [
      'Pemeliharaan Mesin Kendaraan Ringan',
      'Perbaikan Sistem Kelistrikan Kendaraan',
      'Perawatan Sistem Sasis dan Pemindah Tenaga',
      'Overhaul Mesin',
      'Spooring dan Balancing'
    ],
    careerProspects: [
      'Mekanik Mobil Profesional',
      'Service Advisor',
      'Teknisi Bengkel Resmi (Dealer)',
      'Wirausaha Bengkel Mobil',
      'Operator Industri Otomotif'
    ],
    facilities: [
      'Bengkel Otomotif Standar Industri',
      'Engine Stand',
      'Car Lift',
      'Alat Uji Emisi',
      'Scanner EFI'
    ]
  },
  {
    id: 'tbsm',
    name: 'Teknik Bisnis Sepeda Motor',
    slug: 'tbsm',
    shortName: 'TBSM',
    icon: 'Bike',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80',
    description: 'Program keahlian Teknik Bisnis Sepeda Motor (TBSM) menyiapkan siswa menjadi ahli dalam perawatan, perbaikan, dan modifikasi sepeda motor. Siswa juga dibekali pengetahuan kewirausahaan untuk mengelola bengkel atau bisnis suku cadang secara mandiri.',
    shortDescription: 'Mempelajari teknik perawatan, perbaikan sepeda motor, dan manajemen bengkel.',
    competencies: [
      'Pemeliharaan Mesin Sepeda Motor',
      'Perbaikan Kelistrikan Sepeda Motor',
      'Perawatan Sasis Sepeda Motor',
      'Teknologi Injeksi (PGM-FI)',
      'Manajemen Bengkel'
    ],
    careerProspects: [
      'Mekanik Sepeda Motor',
      'Kepala Mekanik (Chief Mechanic)',
      'Wirausaha Bengkel Sepeda Motor',
      'Sales Suku Cadang',
      'Perakit di Industri Sepeda Motor'
    ],
    facilities: [
      'Bengkel Praktik Sepeda Motor',
      'Unit Sepeda Motor Berbagai Tipe (Matic, Sport, Cub)',
      'Peralatan Servis Lengkap',
      'Simulator Sistem Kelistrikan',
      'Scanner Motor Injeksi'
    ]
  },
  {
    id: 'akl',
    name: 'Akuntansi dan Keuangan Lembaga',
    slug: 'akl',
    shortName: 'AKL',
    icon: 'Calculator',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80',
    description: 'Program Akuntansi dan Keuangan Lembaga (AKL) membekali siswa dengan kompetensi dalam mengelola keuangan, menyusun laporan keuangan, perpajakan, dan mengoperasikan aplikasi akuntansi komputer. Lulusan siap bekerja di sektor perbankan, perusahaan swasta, maupun instansi pemerintah.',
    shortDescription: 'Mempelajari penyusunan laporan keuangan, perpajakan, dan aplikasi komputer akuntansi.',
    competencies: [
      'Akuntansi Jasa, Dagang, dan Manufaktur',
      'Administrasi Pajak',
      'Komputer Akuntansi (MYOB/Accurate)',
      'Pengelolaan Kas',
      'Etika Profesi Akuntansi'
    ],
    careerProspects: [
      'Staf Akunting',
      'Kasir / Teller Bank',
      'Staf Administrasi Keuangan',
      'Asisten Auditor',
      'Pegawai Pajak'
    ],
    facilities: [
      'Laboratorium Akuntansi Komputer',
      'Bank Mini',
      'Kalkulator dan Mesin Hitung',
      'Software Akuntansi Asli'
    ]
  }
];

export { programsData as programs };
