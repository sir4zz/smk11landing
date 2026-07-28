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
    title: 'Medali Perak LKS Tingkat Kabupaten',
    event: 'Lomba Kompetensi Siswa (LKS) Kabupaten',
    year: 2024,
    level: 'Kabupaten',
    rank: 'Juara 2',
    students: ['Melati Febriyani'],
    photo: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'ach-3',
    title: 'Peringkat 14 Ajang Prestasi SMK Tingkat Kabupaten',
    event: 'Ajang Prestasi SMK Kabupaten Tangerang',
    year: 2024,
    level: 'Kabupaten',
    rank: 'Medali Perak',
    students: ['Tim SMKN 11 Kab. Tangerang'],
    photo: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'ach-4',
    title: 'Partisipasi LKS Kabel Jaringan Komputer Informasi',
    event: 'Lomba Kompetensi Siswa (LKS) Kabupaten',
    year: 2025,
    level: 'Kabupaten',
    rank: 'Peserta',
    students: ['Febriyani'],
    photo: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'ach-5',
    title: 'Peringatan Maulid Nabi Muhammad SAW',
    event: 'Kegiatan Keagamaan Sekolah',
    year: 2019,
    level: 'Kabupaten',
    rank: 'Partisipasi',
    students: ['Seluruh Siswa dan Guru'],
    photo: 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?auto=format&fit=crop&w=900&q=80'
  }
];

export { achievementsData as achievements };
