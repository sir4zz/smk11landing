export interface Achievement {
  id: string;
  title: string;
  event: string;
  year: number;
  level: string;
  rank: string;
  students: string[];
  photo: string;
}

export const achievementsData: Achievement[] = [
  {
    id: 'ach-1',
    title: 'Juara 1 IT Network Systems Administration',
    event: 'Lomba Kompetensi Siswa (LKS)',
    year: 2026,
    level: 'Provinsi',
    rank: 'Juara 1',
    students: ['Budi Santoso (XII TKJ 1)'],
    photo: '/images/achievements/lks-tkj.jpg'
  },
  {
    id: 'ach-2',
    title: 'Juara 2 Web Technologies',
    event: 'Lomba Kompetensi Siswa (LKS)',
    year: 2025,
    level: 'Kabupaten',
    rank: 'Juara 2',
    students: ['Rizky Aditya (XI RPL 2)'],
    photo: '/images/achievements/lks-rpl.jpg'
  },
  {
    id: 'ach-3',
    title: 'Juara 1 Futsal Antar Pelajar',
    event: 'Bupati Cup Kabupaten Tangerang',
    year: 2025,
    level: 'Kabupaten',
    rank: 'Juara 1',
    students: ['Tim Futsal SMKN 11'],
    photo: '/images/achievements/futsal.jpg'
  },
  {
    id: 'ach-4',
    title: 'Juara 3 Line Follower Robot',
    event: 'National Robotics Competition',
    year: 2024,
    level: 'Nasional',
    rank: 'Juara 3',
    students: ['Dimas (XII TKJ 2)', 'Gilang (XII TKJ 2)'],
    photo: '/images/achievements/robotik.jpg'
  },
  {
    id: 'ach-5',
    title: 'Harapan 1 Olimpiade Akuntansi',
    event: 'Olimpiade Akuntansi Nasional Vokasi',
    year: 2024,
    level: 'Nasional',
    rank: 'Harapan 1',
    students: ['Nisa Salsabila (XII AKL 1)'],
    photo: '/images/achievements/akuntansi.jpg'
  },
  {
    id: 'ach-6',
    title: 'Juara 2 Paskibra Formasi Terbaik',
    event: 'Lomba Ketangkasan Baris Berbaris (LKBB)',
    year: 2023,
    level: 'Provinsi',
    rank: 'Juara 2',
    students: ['Paskibra Satria 11'],
    photo: '/images/achievements/paskibra.jpg'
  },
  {
    id: 'ach-7',
    title: 'Juara 1 Lomba Cipta Puisi Kebangsaan',
    event: 'Bulan Bahasa & Sastra',
    year: 2023,
    level: 'Kabupaten',
    rank: 'Juara 1',
    students: ['Dewi Lestari (X AKL 2)'],
    photo: '/images/achievements/puisi.jpg'
  },
  {
    id: 'ach-8',
    title: 'Best Mechanic Contest',
    event: 'AHASS Vocational Skill Contest',
    year: 2023,
    level: 'Regional',
    rank: 'Peringkat 2',
    students: ['Fajar Hidayat (XII TBSM 1)'],
    photo: '/images/achievements/tbsm-contest.jpg'
  }
];

export { achievementsData as achievements };
