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
    title: 'Pembinaan Fisik & Keterampilan Baris-Beribu',
    description:
      'Latihan fisik dan keterampilan PBB yang rutin dilaksanakan untuk menjaga kebugaran dan membangun kekompakan antarsiswa.',
    activity_date: '2026-03-20',
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
];

export const defaultKesemaptaanAchievements: KesemaptaanAchievement[] = [
  {
    id: 'kc1',
    name: 'Juara II Lomba Baris-Berbaris Tingkat Kabupaten',
    year: '2025',
    description: 'Tim PBB SMKN 11 meraih juara kedua dalam ajang lomba baris-berbu tingkat Kabupaten Tangerang.',
    documentation: [],
  },
];