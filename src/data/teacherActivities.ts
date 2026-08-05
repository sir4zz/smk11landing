export interface TeacherActivity {
  id: string;
  title: string;
  date: string;
  category: string;
  description: string;
  photo: string;
}

export const teacherActivitiesData: TeacherActivity[] = [
  {
    id: 'ta-1',
    title: 'Workshop Penyusunan Perangkat Pembelajaran Kurikulum Merdeka',
    date: '2026-01-15',
    category: 'Workshop',
    description: 'Seluruh guru mengikuti workshop penyusunan modul ajar dan asesmen berbasis Kurikulum Merdeka yang dibimbing oleh narasumber dari Dinas Pendidikan Provinsi Banten.',
    photo: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'ta-2',
    title: 'Rapat Evaluasi Pembelajaran Semester Ganjil',
    date: '2026-01-10',
    category: 'Rapat',
    description: 'Evaluasi hasil pembelajaran semester ganjil untuk perbaikan mutu layanan pembelajaran pada semester genap.',
    photo: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'ta-3',
    title: 'Pelatihan Asesmen Kompetensi dan Pembelajaran Berbasis Proyek',
    date: '2026-02-05',
    category: 'Workshop',
    description: 'Pelatihan internal guru untuk menguatkan asesmen kompetensi dan penerapan pembelajaran berbasis proyek (PjBL).',
    photo: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'ta-4',
    title: 'Upacara dan Syukuran Peringatan Hari Guru Nasional',
    date: '2025-11-25',
    category: 'Hari Besar',
    description: 'Kegiatan apresiasi kepada seluruh guru atas dedikasi mereka dalam mencerdaskan murid SMKN 11 Kabupaten Tangerang.',
    photo: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'ta-5',
    title: 'Gotong Royong dan Persiapan Lingkungan Sekolah',
    date: '2026-02-14',
    category: 'Kegiatan Sosial',
    description: 'Seluruh pendidik dan tenaga kependidikan bergotong royong menata lingkungan sekolah menjelang dimulainya semester genap.',
    photo: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'ta-6',
    title: 'Pelatihan Pemanfaatan Teknologi AI dalam Pembelajaran',
    date: '2026-04-20',
    category: 'Workshop',
    description: 'Guru mengikuti pelatihan pemanfaatan teknologi kecerdasan buatan (AI) untuk mendukung penyusunan bahan ajar dan asesmen yang inovatif.',
    photo: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'ta-7',
    title: 'Studi Tirah ke SMK Unggulan di Jakarta',
    date: '2026-05-12',
    category: 'Studi Tirah',
    description: 'Sejumlah guru produktif melaksanakan studi tirah ke SMK unggulan di Jakarta untuk benchmarking kurikulum dan praktik industri.',
    photo: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'ta-8',
    title: 'Rapat Koordinasi dengan Dunia Usaha dan Industri (DUDI)',
    date: '2026-06-03',
    category: 'Rapat',
    description: 'Rapat koordinasi bersama perusahaan mitra untuk membahas program Praktik Kerja Lapangan (PKL) dan penyerapan lulusan tahun ajaran 2026/2027.',
    photo: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80',
  },
];

export { teacherActivitiesData as teacherActivities };
