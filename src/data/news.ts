export interface NewsItem {
  id: string;
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  content: string;
  thumbnail: string;
  category: string;
  author: string;
}

export const newsData: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Siswa SMKN 11 Kabupaten Tangerang Raih Medali Ajang Prestasi 2025',
    slug: 'ajang-prestasi-2025',
    date: '2025-10-15',
    excerpt: 'Febriyani, siswa SMKN 11 Kabupaten Tangerang, berhasil meraih medali perak pada Ajang Prestasi SMK Tingkat Kabupaten Tangerang tahun 2025.',
    content: '<p>Prestasi membanggakan kembali diraih oleh siswa SMKN 11 Kabupaten Tangerang. Febriyani berhasil meraih medali perak pada Ajang Prestasi SMK Tingkat Kabupaten Tangerang tahun 2025 yang diselenggarakan di Sub Rayon 03.</p><p>Keberhasilan ini merupakan buah dari persiapan matang dan bimbingan intensif dari para guru pembimbing. "Febriyani menunjukkan dedikasi yang luar biasa dan penguasaan materi yang sangat baik," ujar pembimbing.</p><p>Prestasi ini menjadi motivasi bagi siswa lainnya untuk terus berprestasi di berbagai ajang kompetisi. Pihak sekolah berkomitmen penuh untuk memberikan dukungan fasilitas dan pembimbingan intensif agar siswa dapat terus menorehkan prestasi gemilang.</p>',
    thumbnail: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
    category: 'Prestasi',
    author: 'Tim Humas'
  },
  {
    id: 'news-2',
    title: 'Penerimaan Peserta Didik Baru (PPDB) Tahun Ajaran 2026/2027 Segera Dibuka',
    slug: 'info-ppdb-2026',
    date: '2026-06-15',
    excerpt: 'Informasi lengkap terkait jadwal, persyaratan, dan alur pendaftaran PPDB SMKN 11 Kabupaten Tangerang tahun ajaran 2026/2027.',
    content: '<p>Penerimaan Peserta Didik Baru (PPDB) SMKN 11 Kabupaten Tangerang tahun ajaran 2026/2027 akan segera dibuka secara online (daring) melalui portal resmi PPDB Provinsi Banten. Pendaftaran tahap pertama direncanakan mulai tanggal 20 hingga 25 Juni 2026.</p><p>Untuk tahun ini, SMKN 11 Kabupaten Tangerang membuka pendaftaran untuk 6 Program Keahlian, yaitu TJKT (Teknik Jaringan Komputer dan Telekomunikasi), DKV (Desain Komunikasi Visual), Teknik Otomotif, TITL (Teknik Ketenagalistrikan), MPLB (Manajemen Perkantoran dan Layanan Bisnis), dan Busana. Daya tampung total diperkirakan mencapai 400 siswa yang akan terbagi dalam 11 rombongan belajar. Jalur pendaftaran meliputi jalur zonasi, prestasi akademik/non-akademik, afirmasi, dan perpindahan tugas orang tua.</p><p>Calon peserta didik dan orang tua diimbau untuk menyiapkan dokumen persyaratan seperti SKL, Kartu Keluarga, dan sertifikat prestasi (jika ada) jauh-jauh hari. Informasi petunjuk teknis pendaftaran dapat diunduh melalui halaman utama website ini.</p>',
    thumbnail: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80',
    category: 'Informasi',
    author: 'Panitia PPDB'
  },
  {
    id: 'news-3',
    title: 'Kunjungan Industri Jurusan Teknik Otomotif ke Pabrik Perakitan Mobil',
    slug: 'kunjungan-industri-otomotif',
    date: '2026-05-10',
    excerpt: 'Siswa kelas XI Teknik Otomotif mengikuti kegiatan Kunjungan Industri (KI) ke salah satu pabrik perakitan mobil ternama di Cikarang.',
    content: '<p>Dalam rangka menyelaraskan kurikulum dengan dunia industri, sebanyak 65 siswa kelas XI jurusan Teknik Otomotif beserta guru pendamping melaksanakan Kunjungan Industri (KI) ke sebuah pabrik perakitan mobil skala internasional di kawasan industri Cikarang pada hari Rabu lalu.</p><p>Selama kunjungan, para siswa diajak mengelilingi fasilitas produksi dan mengamati langsung proses perakitan kendaraan mulai dari pengelasan bodi (welding), pengecatan (painting), hingga tahap perakitan akhir (assembling) dan uji kualitas. Kegiatan ini memberikan gambaran nyata tentang standar operasional kerja dan teknologi mutakhir yang digunakan dalam industri otomotif.</p><p>Kepala Program Keahlian Teknik Otomotif berharap kegiatan KI ini dapat memotivasi siswa untuk terus mengasah keterampilan mereka agar kelak menjadi mekanik dan teknisi andal yang siap bersaing di dunia kerja nyata setelah lulus.</p>',
    thumbnail: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=900&q=80',
    category: 'Kegiatan',
    author: 'Tim Humas'
  },
  {
    id: 'news-4',
    title: 'Peresmian Laboratorium Desain Komunikasi Visual Baru',
    slug: 'peresmian-lab-dkv',
    date: '2026-04-22',
    excerpt: 'SMKN 11 Kabupaten Tangerang resmi membuka laboratorium multimedia baru khusus untuk praktik siswa jurusan Desain Komunikasi Visual (DKV).',
    content: '<p>Dalam upaya meningkatkan kualitas pendidikan vokasi, Kepala SMKN 11 Kabupaten Tangerang resmi meresmikan Laboratorium Desain Komunikasi Visual (DKV) yang baru pada Kamis, 22 April 2026. Lab baru ini dilengkapi dengan 35 unit komputer spesifikasi tinggi (Core i7, RAM 16GB, SSD 512GB) yang sangat memadai untuk aktivitas desain grafis, editing video, dan rendering 3D.</p><p>Selain peningkatan perangkat keras, lab ini juga difasilitasi dengan koneksi internet serat optik dedicated, studio mini, dan perangkat kamera untuk praktik fotografi dan videografi. Pembaruan fasilitas ini diharapkan dapat mendukung pembelajaran produktif seperti desain grafis, animasi, dan produksi konten digital.</p><p>Siswa menyambut baik kehadiran lab ini. "Kami sangat senang dengan adanya lab baru ini, sekarang kami bisa melakukan rendering dan editing video dengan jauh lebih lancar tanpa kendala," ungkap salah satu siswa jurusan DKV.</p>',
    thumbnail: '/images/news-4.jpg',
    category: 'Fasilitas',
    author: 'Tim Humas'
  },
  {
    id: 'news-5',
    title: 'Pelaksanaan Uji Kompetensi Keahlian (UKK) Tahun 2026 Berjalan Lancar',
    slug: 'pelaksanaan-ukk-2026',
    date: '2026-03-05',
    excerpt: 'Seluruh siswa kelas XII dari enam program keahlian sukses mengikuti Uji Kompetensi Keahlian (UKK) sebagai syarat kelulusan.',
    content: '<p>Uji Kompetensi Keahlian (UKK) bagi siswa kelas XII SMKN 11 Kabupaten Tangerang tahun pelajaran 2025/2026 telah selesai diselenggarakan dengan sukses dan lancar. Kegiatan yang berlangsung selama satu pekan ini melibatkan penguji internal (guru produktif) maupun penguji eksternal dari dunia usaha dan industri (DUDI).</p><p>UKK bertujuan mengukur pencapaian kompetensi siswa pada jenjang tertentu sesuai dengan kompetensi keahlian yang ditempuh. Tiap jurusan menyajikan tantangan yang berbeda, misalnya jurusan MPLB dengan ujian praktik administrasi perkantoran, sedangkan jurusan Teknik Otomotif dengan praktik troubleshooting sistem injeksi dan perbaikan mesin.</p><p>Para penguji eksternal mengapresiasi kemampuan dan kedisiplinan kerja para siswa selama ujian. Sebagian besar siswa dinyatakan sangat kompeten dan memenuhi standar yang dibutuhkan oleh industri. Sertifikat kompetensi yang akan mereka peroleh nantinya sangat berguna sebagai bekal melamar pekerjaan.</p>',
    thumbnail: '/images/news-5.jpg',
    category: 'Akademik',
    author: 'Kurikulum'
  },
  {
    id: 'news-6',
    title: 'Peringatan Hari Guru Nasional di SMKN 11 Kab. Tangerang',
    slug: 'hari-guru-nasional',
    date: '2025-11-25',
    excerpt: 'Rangkaian acara meriah peringatan Hari Guru Nasional dirayakan oleh seluruh guru dan siswa dengan penuh rasa kekeluargaan.',
    content: '<p>Peringatan Hari Guru Nasional (HGN) tahun ini di SMKN 11 Kabupaten Tangerang berlangsung sangat meriah dan penuh makna. Kegiatan diawali dengan upacara bendera di lapangan utama sekolah, di mana petugas upacara merupakan perwakilan dari bapak/ibu guru sendiri. Hal ini memberikan suasana berbeda dan sangat berkesan bagi para siswa.</p><p>Setelah upacara, acara dilanjutkan dengan pemotongan tumpeng dan penampilan pentas seni persembahan dari ekstrakurikuler serta perwakilan setiap kelas. Puncak acara ditandai dengan penyerahan buket bunga secara simbolis oleh pengurus OSIS kepada Kepala Sekolah dan para guru, sebagai bentuk penghormatan dan rasa terima kasih atas jasa mereka dalam mendidik siswa-siswi.</p><p>"Guru adalah pahlawan tanpa tanda jasa. Kami berharap semua guru senantiasa diberikan kesehatan dan kesabaran dalam mencetak generasi penerus bangsa yang unggul, terampil, dan berkarakter," tutur Ketua OSIS dalam sambutannya.</p>',
    thumbnail: '/images/news-6.jpg',
    category: 'Kegiatan',
    author: 'OSIS'
  }
];

export { newsData as news };
