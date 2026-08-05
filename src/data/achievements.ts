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
    title: 'Medali Perak Ajang Prestasi SMK Kabupaten Tangerang',
    event: 'Ajang Prestasi SMK Kabupaten Tangerang',
    year: 2025,
    level: 'Kabupaten',
    rank: 'Medali Perak',
    students: ['Febriyani'],
    photo: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'ach-2',
    title: 'Juara 2 LKS Bidang IT Network Systems Tingkat Kabupaten',
    event: 'Lomba Kompetensi Siswa (LKS) Kabupaten Tangerang',
    year: 2024,
    level: 'Kabupaten',
    rank: 'Juara 2',
    students: ['Melati Febriyani', 'Rangga Saputra'],
    photo: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'ach-3',
    title: 'Juara 3 LKS Bidang Web Technologies Tingkat Provinsi Banten',
    event: 'Lomba Kompetensi Siswa (LKS) Provinsi Banten',
    year: 2025,
    level: 'Provinsi',
    rank: 'Juara 3',
    students: ['Bayu Pratama', 'Dinda Aulia'],
    photo: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'ach-4',
    title: 'Partisipasi LKS Bidang IT Network Cabling Tingkat Kabupaten',
    event: 'Lomba Kompetensi Siswa (LKS) Kabupaten Tangerang',
    year: 2025,
    level: 'Kabupaten',
    rank: 'Peserta',
    students: ['Febriyani', 'Ilham Maulana'],
    photo: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'ach-5',
    title: 'Juara 1 Lomba Cerdas Cermat Tingkat Kabupaten Tangerang',
    event: 'Lomba Cerdas Cermat SMK Se-Kabupaten Tangerang',
    year: 2024,
    level: 'Kabupaten',
    rank: 'Juara 1',
    students: ['Tim SMKN 11 Kab. Tangerang'],
    photo: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'ach-6',
    title: 'Juara 1 Turnamen Futsal Bupati Cup Kabupaten Tangerang',
    event: 'Turnamen Futsal Bupati Cup Kabupaten Tangerang',
    year: 2025,
    level: 'Kabupaten',
    rank: 'Juara 1',
    students: ['Tim Futsal SMKN 11'],
    photo: 'https://images.unsplash.com/photo-1552664688-cf1ec3b78426?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'ach-7',
    title: 'Juara 2 Lomba Baris-Berbaris (PBB) Tingkat Kabupaten',
    event: 'Lomba Baris-Berbaris PBB SMK Se-Kabupaten Tangerang',
    year: 2025,
    level: 'Kabupaten',
    rank: 'Juara 2',
    students: ['Tim PBB Satria 11'],
    photo: 'https://images.unsplash.com/photo-1526976668913-0b7520b8c12d?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'ach-8',
    title: 'Juara Harapan 1 Lomba Desain Poster Tingkat Provinsi Banten',
    event: 'Festival Seni dan Desain Pelajar Provinsi Banten',
    year: 2024,
    level: 'Provinsi',
    rank: 'Harapan',
    students: ['Nabila Putri', 'Salsabila'],
    photo: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'ach-9',
    title: 'Juara 3 Lomba Videografi Pendek Tingkat Kabupaten',
    event: 'Festival Film Pendek Pelajar Kabupaten Tangerang',
    year: 2025,
    level: 'Kabupaten',
    rank: 'Juara 3',
    students: ['Reza Pratama', 'Ayunda Kirana', 'Fadli Rahman'],
    photo: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'ach-10',
    title: 'Partisipasi Olimpiade Matematika Tingkat Provinsi Banten',
    event: 'Olimpiade Sains Nasional (OSN) Provinsi Banten',
    year: 2025,
    level: 'Provinsi',
    rank: 'Partisipasi',
    students: ['Ahmad Zaki', 'Lestari Dewi'],
    photo: 'https://images.unsplash.com/photo-1456513080510-7bf31984b480?auto=format&fit=crop&w=900&q=80'
  }
];

export { achievementsData as achievements };
