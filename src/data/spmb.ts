export type SpmbStatus = 'dibuka' | 'ditutup';

export interface SpmbScheduleItem {
  category: 'pendaftaran' | 'seleksi' | 'pengumuman' | 'daftar_ulang';
  date: string;
  title: string;
}

export interface SpmbFlowStep {
  title: string;
  description: string;
}

export interface SpmbFaqItem {
  question: string;
  answer: string;
}

export interface SpmbContent {
  id?: string;
  status: SpmbStatus;
  title: string;
  description: string;
  latest_info: string;
  requirements: string[];
  schedule: SpmbScheduleItem[];
  flow_steps: SpmbFlowStep[];
  faq: SpmbFaqItem[];
  portal_url: string;
  banner_image: string;
  banner_title: string;
  banner_description: string;
  updated_at?: string;
}

export const defaultSpmbContent: SpmbContent = {
  status: 'dibuka',
  title: 'Seleksi Penerimaan Murid Baru (SPMB) SMKN 11 Kabupaten Tangerang',
  description:
    'SPMB adalah sistem penerimaan murid baru untuk jenjang pendidikan menengah kejuruan. SMKN 11 Kabupaten Tangerang mengikuti SPMB Provinsi Banten yang diselenggarakan secara online melalui portal resmi pemerintah.',
  latest_info:
    'Pendaftaran SPMB Tahun Ajaran 2026/2027 akan dibuka melalui portal resmi SPMB Provinsi Banten. Calon murid wajib mendaftar secara online di portal resmi, bukan melalui website sekolah.',
  requirements: [
    'Ijazah SMP / Surat Keterangan Lulus (SKL)',
    'Kartu Keluarga (KK)',
    'Akta Kelahiran',
    'Pas Foto Berwarna (3x4)',
    'SKHUN / Surat Keterangan Hasil Ujian Nasional',
    'Rapor SMP Semester 1 - 5',
    'Kartu NISN (jika ada)',
    'Sertifikat prestasi (jika mendaftar jalur prestasi)',
  ],
  schedule: [
    { category: 'pendaftaran', date: '20-25 Juni 2026', title: 'Pendaftaran Online' },
    { category: 'seleksi', date: '1-5 Juli 2026', title: 'Seleksi Administrasi & Akademik' },
    { category: 'pengumuman', date: '10 Juli 2026', title: 'Pengumuman Hasil Seleksi' },
    { category: 'daftar_ulang', date: '11-15 Juli 2026', title: 'Daftar Ulang' },
  ],
  flow_steps: [
    { title: 'Informasi', description: 'Pelajari informasi SPMB, jadwal, dan persyaratan di halaman ini' },
    { title: 'Persiapan Persyaratan', description: 'Siapkan dokumen administrasi yang diperlukan' },
    { title: 'Daftar di Portal Resmi', description: 'Lakukan pendaftaran melalui portal SPMB Provinsi Banten' },
    { title: 'Seleksi', description: 'Ikuti tahap seleksi sesuai jadwal yang ditetapkan' },
    { title: 'Pengumuman', description: 'Cek hasil seleksi di portal resmi SPMB' },
    { title: 'Daftar Ulang', description: 'Lakukan daftar ulang jika dinyatakan diterima' },
  ],
  faq: [
    {
      question: 'Apa itu SPMB?',
      answer:
        'SPMB (Seleksi Penerimaan Murid Baru) adalah sistem penerimaan siswa baru yang diselenggarakan oleh Dinas Pendidikan Provinsi Banten secara terpusat melalui portal online resmi.',
    },
    {
      question: 'Di mana saya mendaftar?',
      answer:
        'Pendaftaran dilakukan melalui portal resmi SPMB Provinsi Banten, bukan melalui website sekolah. Gunakan tombol DAFTAR SPMB di halaman ini untuk menuju portal resmi.',
    },
    {
      question: 'Kapan pendaftaran SPMB dibuka?',
      answer:
        'Jadwal pendaftaran mengikuti ketentuan SPMB Provinsi Banten. Lihat bagian Jadwal di halaman ini untuk informasi terbaru.',
    },
    {
      question: 'Apakah ada biaya pendaftaran?',
      answer:
        'Pendaftaran SPMB tidak dipungut biaya (gratis). Biaya yang timbul hanya pada saat daftar ulang untuk seragam dan keperluan pribadi siswa.',
    },
    {
      question: 'Apakah menerima siswa dari luar daerah?',
      answer:
        'Ya, SMKN 11 Kabupaten Tangerang menerima siswa sesuai kuota jalur zonasi, prestasi, afirmasi, dan perpindahan tugas orang tua yang ditetapkan SPMB Provinsi Banten.',
    },
  ],
  portal_url: 'https://spmb.bantenprov.go.id',
  banner_image:
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80',
  banner_title: 'SPMB SMKN 11 Kabupaten Tangerang',
  banner_description:
    'Portal informasi resmi SPMB. Pendaftaran dilakukan melalui portal SPMB Provinsi Banten.',
};

export const scheduleCategoryLabels: Record<SpmbScheduleItem['category'], string> = {
  pendaftaran: 'Jadwal Pendaftaran',
  seleksi: 'Jadwal Seleksi',
  pengumuman: 'Jadwal Pengumuman',
  daftar_ulang: 'Jadwal Daftar Ulang',
};
