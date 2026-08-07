import type { JobVacancyRow } from '../lib/api';

export interface JobItem extends JobVacancyRow {}

export const jobVacancyData: JobItem[] = [
  {
    id: 'job-1',
    company_name: 'PT Teknologi Nusantara',
    company_logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=400&q=80',
    position: 'Junior Web Developer',
    slug: 'pt-teknologi-nusantara-junior-web-developer',
    company_description:
      'PT Teknologi Nusantara adalah perusahaan teknologi yang fokus pada pengembangan aplikasi web dan mobile untuk klien di berbagai sektor industri.',
    job_description:
      'Kami mencari Junior Web Developer yang antusias untuk bergabung dalam tim pengembangan produk kami. Anda akan terlibat dalam pengembangan fitur baru, pemeliharaan sistem, dan kolaborasi bersama tim produk.',
    responsibilities: 'Membangun dan mengembangkan fitur aplikasi web baru\nMemperbaiki bug dan melakukan pemeliharaan sistem\nBerkolaborasi dengan tim desain dan produk\nMenulis kode yang bersih dan terdokumentasi dengan baik',
    requirements: 'Menguasai PHP (Laravel) dan JavaScript (React)\nMemahami HTML, CSS, dan konsep REST API\nFresh graduate dipersilakan\nMampu bekerja dalam tim\nPengalaman dengan database MySQL menjadi nilai tambah',
    benefits: 'Gaji kompetitif\nBPJS Kesehatan & Ketenagakerjaan\nTunjangan makan & transport\nKesempatan pengembangan karier',
    education: 'SMK',
    experience: 'Fresh graduate / 0-1 tahun',
    major: 'TJKT, RPL',
    city: 'Tangerang',
    location: 'BSD City, Tangerang Selatan',
    employment_type: 'full_time',
    registration_link: 'https://example.com/apply/junior-web-developer',
    hr_contact: 'hr@teknologinusantara.id',
    deadline: '2026-08-31',
    status: 'open',
    is_published: true,
  },
  {
    id: 'job-2',
    company_name: 'CV Kreatif Desain',
    company_logo: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=400&q=80',
    position: 'Graphic Designer (Magang)',
    slug: 'cv-kreatif-desain-graphic-designer-magang',
    company_description:
      'CV Kreatif Desain adalah studio kreatif yang bergerak di bidang desain grafis dan branding untuk berbagai brand lokal.',
    job_description:
      'Program magang untuk siswa/i SMK jurusan DKV. Anda akan belajar langsung dari tim kreatif kami dan terlibat dalam proyek desain nyata untuk klien.',
    responsibilities: 'Membuat desain konten untuk media sosial\nMendukung produksi materi branding\nMembantu riset visual dan moodboard',
    requirements: 'Siswa/i aktif SMK jurusan DKV\nMenguasai Adobe Photoshop dan Illustrator\nPortofolio sederhana diutamakan\nKreatif dan mau belajar',
    benefits: 'Sertifikat magang\nUang transport\nPortofolio proyek nyata\nKesempatan direkrut menjadi karyawan',
    education: 'SMK',
    experience: 'Tidak wajib',
    major: 'DKV',
    city: 'Tangerang',
    location: 'Serpong, Tangerang Selatan',
    employment_type: 'internship',
    registration_link: 'https://example.com/magang/graphic-designer',
    hr_contact: '0812-3456-7890',
    deadline: '2026-08-20',
    status: 'closing',
    is_published: true,
  },
  {
    id: 'job-3',
    company_name: 'PT Mandiri Perkasa Motor',
    company_logo: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=400&q=80',
    position: 'Mekanik Kendaraan Ringan',
    slug: 'pt-mandiri-perkasa-motor-mekanik',
    company_description:
      'Perusahaan otomotif yang bergerak di bidang perawatan dan perbaikan kendaraan ringan dengan jaringan bengkel di beberapa kota.',
    job_description:
      'Kami membuka lowongan untuk posisi Mekanik Kendaraan Ringan. Posisi ini terbuka bagi lulusan SMK Teknik Otomotif yang siap belajar dan berkembang bersama kami.',
    responsibilities: 'Melakukan perawatan dan perbaikan kendaraan ringan\nDiagnosa kerusakan mesin dan kelistrikan kendaraan\nMenjaga kebersihan dan kerapian area kerja',
    requirements: 'Lulusan SMK Teknik Otomotif\nMenguasai dasar-dasar mesin dan kelistrikan kendaraan\nMemiliki SIM C\nSiap bekerja dalam tim',
    benefits: 'Gaji sesuai UMK\nBPJS Ketenagakerjaan\nPelatihan bersertifikat',
    education: 'SMK',
    experience: '0-2 tahun',
    major: 'Teknik Otomotif',
    city: 'Tangerang',
    location: 'Cikupa, Kabupaten Tangerang',
    employment_type: 'full_time',
    registration_link: 'https://example.com/apply/mekanik',
    hr_contact: '021-555-1234',
    deadline: '2026-08-15',
    status: 'closed',
    is_published: true,
  },
];

export { jobVacancyData as jobs };
