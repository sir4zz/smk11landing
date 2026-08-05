export interface KesemaptaanProfile {
  id?: string;
  title: string;
  description: string;
  photo: string;
}

export interface KesemaptaanActivity {
  id?: string;
  title: string;
  description: string;
  activity_date?: string | null;
  documentation: string[];
  status: string;
}

export interface KesemaptaanSchedule {
  id?: string;
  day: string;
  time: string;
  place: string;
}

export interface KesemaptaanInstructor {
  id?: string;
  name: string;
  role: string;
  photo: string;
  sort_order: number;
}

export interface KesemaptaanAchievement {
  id?: string;
  name: string;
  year: string;
  description: string;
  documentation: string[];
}

export const defaultKesemaptaanProfile: KesemaptaanProfile = {
  title: 'Kesemaptaan SMKN 11 Kabupaten Tangerang',
  description:
    'Kesemaptaan adalah program pembinaan kedisiplinan, fisik, dan ketahanan mental serta keterampilan baris-berbaris (PBB) bagi siswa. Kegiatan ini membentuk karakter disiplin, tangguh, dan bertanggung jawab yang sejalan dengan nilai-nilai sekolah.',
  photo: '',
};

export const defaultKesemaptaanActivities: KesemaptaanActivity[] = [
  {
    id: 'ka1',
    title: 'Latihan Dasar Kedisiplinan (LDK)',
    description:
      'Pelatihan dasar kedisiplinan dan pembinaan fisik untuk membentuk karakter siswa yang tertib, bertanggung jawab, dan siap menghadapi tantangan.',
    activity_date: '2026-02-10',
    documentation: [],
    status: 'published',
  },
  {
    id: 'ka2',
    title: 'Pembinaan Fisik & Keterampilan Baris-Berbaris',
    description:
      'Latihan fisik dan keterampilan PBB yang rutin dilaksanakan untuk menjaga kebugaran dan membangun kekompakan antarsiswa.',
    activity_date: '2026-03-20',
    documentation: [],
    status: 'published',
  },
  {
    id: 'ka3',
    title: 'Latihan Khusus Tim PBB Satria 11',
    description:
      'Latihan intensif bagi tim PBB Satria 11 dalam persiapan mengikuti lomba baris-berbaris tingkat kabupaten dan provinsi.',
    activity_date: '2026-05-15',
    documentation: [],
    status: 'published',
  },
  {
    id: 'ka4',
    title: 'Upacara Apel Besar & Pelantikan Anggota Baru',
    description:
      'Apel besar sekolah sekaligus pelantikan anggota baru tim Kesemaptaan SMKN 11 Kabupaten Tangerang periode 2025/2026.',
    activity_date: '2026-08-30',
    documentation: [],
    status: 'published',
  },
];

export const defaultKesemaptaanSchedules: KesemaptaanSchedule[] = [
  { id: 'ks1', day: 'Senin', time: '15.30 - 17.00', place: 'Lapangan Sekolah' },
  { id: 'ks2', day: 'Rabu', time: '15.30 - 17.00', place: 'Lapangan Sekolah' },
  { id: 'ks3', day: 'Sabtu', time: '08.00 - 10.00', place: 'Lapangan Sekolah' },
];

export const defaultKesemaptaanInstructors: KesemaptaanInstructor[] = [
  { id: 'ki1', name: 'Serka Ahmad Yani', role: 'Pembina Utama', photo: '', sort_order: 1 },
  { id: 'ki2', name: 'Pelda Rina Kusuma', role: 'Instruktur PBB', photo: '', sort_order: 2 },
  { id: 'ki3', name: 'Kopda Sutrisno', role: 'Instruktur Fisik & Mental', photo: '', sort_order: 3 },
];

export const defaultKesemaptaanAchievements: KesemaptaanAchievement[] = [
  {
    id: 'kc1',
    name: 'Juara II Lomba Baris-Berbaris Tingkat Kabupaten',
    year: '2025',
    description: 'Tim PBB SMKN 11 meraih juara kedua dalam ajang lomba baris-berbaris tingkat Kabupaten Tangerang.',
    documentation: [],
  },
  {
    id: 'kc2',
    name: 'Juara III Lomba PBB Se-Kabupaten Tangerang',
    year: '2024',
    description: 'Tim PBB Satria 11 meraih juara ketiga dalam lomba baris-berbaris antar SMK se-Kabupaten Tangerang tahun 2024.',
    documentation: [],
  },
  {
    id: 'kc3',
    name: 'Best Performance Pasukan Pengibar Bendera',
    year: '2025',
    description: 'Paskibra Satria 11 mendapatkan penghargaan Best Performance pada kegiatan upacara peringatan Hari Kemerdekaan tingkat kabupaten.',
    documentation: [],
  },
];