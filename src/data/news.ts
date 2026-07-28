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
    title: 'Siswa SMKN 11 Kabupaten Tangerang Juara 1 LKS Tingkat Provinsi',
    slug: 'juara-1-lks-provinsi',
    date: '2026-07-20',
    excerpt: 'Prestasi membanggakan kembali diraih oleh siswa jurusan TKJ pada ajang Lomba Kompetensi Siswa (LKS) bidang IT Network Systems Administration tingkat Provinsi Banten.',
    content: '<p>Kabar gembira datang dari ajang Lomba Kompetensi Siswa (LKS) tingkat Provinsi Banten tahun 2026. Siswa perwakilan SMKN 11 Kabupaten Tangerang, Budi Santoso dari jurusan Teknik Komputer dan Jaringan (TKJ), berhasil meraih Juara 1 pada bidang IT Network Systems Administration.</p><p>Keberhasilan ini merupakan buah dari persiapan matang yang dilakukan selama lebih dari tiga bulan di bawah bimbingan guru produktif TKJ. "Budi menunjukkan dedikasi yang luar biasa dan pemahaman teknis yang sangat mendalam terkait konfigurasi jaringan dan keamanan sistem," ujar Bapak Hendra, pembimbing LKS.</p><p>Dengan kemenangan ini, Budi Santoso berhak mewakili Provinsi Banten untuk berlaga di LKS tingkat Nasional yang akan diselenggarakan bulan depan. Pihak sekolah berkomitmen penuh untuk memberikan dukungan fasilitas dan pembimbingan intensif agar dapat menorehkan prestasi gemilang di kancah nasional.</p>',
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
    content: '<p>Penerimaan Peserta Didik Baru (PPDB) SMKN 11 Kabupaten Tangerang tahun ajaran 2026/2027 akan segera dibuka secara online (daring) melalui portal resmi PPDB Provinsi Banten. Pendaftaran tahap pertama direncanakan mulai tanggal 20 hingga 25 Juni 2026.</p><p>Untuk tahun ini, SMKN 11 Kabupaten Tangerang membuka pendaftaran untuk 5 Program Keahlian, yaitu TKJ, RPL, TKR, TBSM, dan AKL. Daya tampung total diperkirakan mencapai 400 siswa yang akan terbagi dalam 11 rombongan belajar. Jalur pendaftaran meliputi jalur zonasi, prestasi akademik/non-akademik, afirmasi, dan perpindahan tugas orang tua.</p><p>Calon peserta didik dan orang tua diimbau untuk menyiapkan dokumen persyaratan seperti SKL, Kartu Keluarga, dan sertifikat prestasi (jika ada) jauh-jauh hari. Informasi petunjuk teknis pendaftaran dapat diunduh melalui halaman utama website ini.</p>',
    thumbnail: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80',
    category: 'Informasi',
    author: 'Panitia PPDB'
  },
  {
    id: 'news-3',
    title: 'Kunjungan Industri Jurusan TKR ke Pabrik Perakitan Mobil',
    slug: 'kunjungan-industri-tkr',
    date: '2026-05-10',
    excerpt: 'Siswa kelas XI Teknik Kendaraan Ringan mengikuti kegiatan Kunjungan Industri (KI) ke salah satu pabrik perakitan mobil ternama di Cikarang.',
    content: '<p>Dalam rangka menyelaraskan kurikulum dengan dunia industri, sebanyak 72 siswa kelas XI jurusan Teknik Kendaraan Ringan (TKR) beserta guru pendamping melaksanakan Kunjungan Industri (KI) ke sebuah pabrik perakitan mobil skala internasional di kawasan industri Cikarang pada hari Rabu lalu.</p><p>Selama kunjungan, para siswa diajak mengelilingi fasilitas produksi dan mengamati langsung proses perakitan kendaraan mulai dari pengelasan bodi (welding), pengecatan (painting), hingga tahap perakitan akhir (assembling) dan uji kualitas. Kegiatan ini memberikan gambaran nyata tentang standar operasional kerja dan teknologi mutakhir yang digunakan dalam industri otomotif.</p><p>Kepala Program Keahlian TKR berharap kegiatan KI ini dapat memotivasi siswa untuk terus mengasah keterampilan mereka agar kelak menjadi mekanik dan teknisi andal yang siap bersaing di dunia kerja nyata setelah lulus.</p>',
    thumbnail: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=900&q=80',
    category: 'Kegiatan',
    author: 'Tim Humas'
  },
  {
    id: 'news-4',
    title: 'Peresmian Laboratorium Rekayasa Perangkat Lunak Baru',
    slug: 'peresmian-lab-rpl',
    date: '2026-04-22',
    excerpt: 'SMKN 11 Kabupaten Tangerang resmi membuka lab komputer baru khusus untuk praktik siswa jurusan Rekayasa Perangkat Lunak (RPL).',
    content: '<p>Dalam upaya meningkatkan kualitas pendidikan vokasi, Kepala SMKN 11 Kabupaten Tangerang resmi meresmikan Laboratorium Rekayasa Perangkat Lunak (RPL) yang baru pada Kamis, 22 April 2026. Lab baru ini dilengkapi dengan 40 unit komputer spesifikasi tinggi (Core i7, RAM 16GB, SSD 512GB) yang sangat memadai untuk aktivitas pengkodean, desain, dan pengembangan perangkat lunak.</p><p>Selain peningkatan perangkat keras, lab ini juga difasilitasi dengan koneksi internet serat optik dedicated dan proyektor interaktif. Pembaruan fasilitas ini diharapkan dapat mendukung pembelajaran produktif seperti pengembangan aplikasi mobile dan web, yang membutuhkan resource komputer yang cukup besar.</p><p>Siswa menyambut baik kehadiran lab ini. "Kami sangat senang dengan adanya lab baru ini, sekarang kami bisa merender project atau menjalankan emulator Android dengan jauh lebih lancar tanpa kendala lag," ungkap salah satu ketua kelas RPL.</p>',
    thumbnail: '/images/news-4.jpg',
    category: 'Fasilitas',
    author: 'Tim Humas'
  },
  {
    id: 'news-5',
    title: 'Pelaksanaan Uji Kompetensi Keahlian (UKK) Tahun 2026 Berjalan Lancar',
    slug: 'pelaksanaan-ukk-2026',
    date: '2026-03-05',
    excerpt: 'Seluruh siswa kelas XII dari lima program keahlian sukses mengikuti Uji Kompetensi Keahlian (UKK) sebagai syarat kelulusan.',
    content: '<p>Uji Kompetensi Keahlian (UKK) bagi siswa kelas XII SMKN 11 Kabupaten Tangerang tahun pelajaran 2025/2026 telah selesai diselenggarakan dengan sukses dan lancar. Kegiatan yang berlangsung selama satu pekan ini melibatkan penguji internal (guru produktif) maupun penguji eksternal dari dunia usaha dan industri (DUDI).</p><p>UKK bertujuan mengukur pencapaian kompetensi siswa pada jenjang tertentu sesuai dengan kompetensi keahlian yang ditempuh. Tiap jurusan menyajikan tantangan yang berbeda, misalnya jurusan AKL dengan ujian praktik aplikasi akuntansi komputer, sedangkan jurusan TBSM dengan praktik troubleshooting sistem injeksi sepeda motor.</p><p>Para penguji eksternal mengapresiasi kemampuan dan kedisiplinan kerja para siswa selama ujian. Sebagian besar siswa dinyatakan sangat kompeten dan memenuhi standar yang dibutuhkan oleh industri. Sertifikat kompetensi yang akan mereka peroleh nantinya sangat berguna sebagai bekal melamar pekerjaan.</p>',
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
