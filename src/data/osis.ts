export interface OsisProfile {
  id?: string;
  name: string;
  description: string;
  period: string;
  logo: string;
}

export interface OsisMember {
  id?: string;
  osis_id?: string;
  name: string;
  position: string;
  division: string;
  photo: string;
  sort_order: number;
}

export interface OsisActivity {
  id?: string;
  title: string;
  description: string;
  photo: string;
  activity_date?: string | null;
  status: string;
}

export const defaultOsisProfile: OsisProfile = {
  name: 'OSIS SMKN 11 Kabupaten Tangerang',
  description:
    'Organisasi Siswa Intra Sekolah (OSIS) SMKN 11 Kabupaten Tangerang adalah wadah organisasi bagi siswa untuk mengembangkan jiwa kepemimpinan, kreativitas, dan kepedulian sosial di lingkungan sekolah maupun masyarakat.',
  period: '2025/2026',
  logo: '',
};

export const defaultOsisMembers: OsisMember[] = [
  { id: 'm1', name: 'Andi Pratama', position: 'Ketua', division: 'Ketua OSIS', photo: '', sort_order: 1 },
  { id: 'm2', name: 'Sinta Lestari', position: 'Wakil Ketua', division: 'Wakil Ketua OSIS', photo: '', sort_order: 2 },
  { id: 'm3', name: 'Rizky Ramadhan', position: 'Sekretaris', division: 'Sekretaris', photo: '', sort_order: 3 },
  { id: 'm4', name: 'Dewi Anggraini', position: 'Wakil Sekretaris', division: 'Sekretaris', photo: '', sort_order: 4 },
  { id: 'm5', name: 'Bayu Setiawan', position: 'Bendahara', division: 'Bendahara', photo: '', sort_order: 5 },
  { id: 'm6', name: 'Nabila Putri', position: 'Wakil Bendahara', division: 'Bendahara', photo: '', sort_order: 6 },
  { id: 'm7', name: 'Ahmad Fauzi', position: 'Ketua Bidang', division: 'Pembinaan Karakter', photo: '', sort_order: 7 },
  { id: 'm8', name: 'Rani Marlina', position: 'Ketua Bidang', division: 'Seni & Kreativitas', photo: '', sort_order: 8 },
  { id: 'm9', name: 'Reza Pratama', position: 'Ketua Bidang', division: 'Olahraga', photo: '', sort_order: 9 },
  { id: 'm10', name: 'Salsabila', position: 'Ketua Bidang', division: 'Keagamaan', photo: '', sort_order: 10 },
  { id: 'm11', name: 'Ilham Maulana', position: 'Ketua Bidang', division: 'Wawasan & Teknologi', photo: '', sort_order: 11 },
  { id: 'm12', name: 'Ayunda Kirana', position: 'Ketua Bidang', division: 'Humas & Publikasi', photo: '', sort_order: 12 },
];

export const defaultOsisActivities: OsisActivity[] = [
  {
    id: 'a1',
    title: 'Latihan Kepemimpinan Siswa (LKS)',
    description:
      'Kegiatan pelatihan kepemimpinan yang diikuti oleh pengurus OSIS dan perwakilan kelas untuk membangun jiwa pemimpin yang tangguh dan bertanggung jawab.',
    photo: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80',
    activity_date: '2026-01-15',
    status: 'published',
  },
  {
    id: 'a2',
    title: 'Peringatan Hari Kemerdekaan RI',
    description:
      'Rangkaian kegiatan perayaan HUT kemerdekaan RI ke-81 yang melibatkan seluruh warga sekolah, mulai dari upacara bendera hingga lomba-lomba kebangsaan.',
    photo: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=900&q=80',
    activity_date: '2026-08-17',
    status: 'published',
  },
  {
    id: 'a3',
    title: 'Bakti Sosial Peduli Lingkungan',
    description:
      'Kegiatan kerja bakti dan penghijauan di sekitar lingkungan sekolah sebagai wujud kepedulian OSIS terhadap kelestarian lingkungan.',
    photo: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=900&q=80',
    activity_date: '2026-03-05',
    status: 'published',
  },
  {
    id: 'a4',
    title: 'Festival Seni & Budaya SMKN 11',
    description:
      'Pentas seni tahunan yang menampilkan berbagai penampilan siswa mulai dari tari, musik, teater, hingga pameran karya siswa jurusan DKV dan Busana.',
    photo: 'https://images.unsplash.com/photo-1516280464613-81e30c6f1f0b?auto=format&fit=crop&w=900&q=80',
    activity_date: '2026-05-25',
    status: 'published',
  },
  {
    id: 'a5',
    title: 'Donor Darah & Sosialisasi Kesehatan',
    description:
      'Kegiatan donor darah bekerja sama dengan PMI Cabang Tangerang serta sosialisasi pola hidup sehat bagi seluruh siswa dan guru.',
    photo: 'https://images.unsplash.com/photo-1615462136150-49bae8b18b30?auto=format&fit=crop&w=900&q=80',
    activity_date: '2026-02-20',
    status: 'published',
  },
];
