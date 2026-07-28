export interface GalleryItem {
  id: string;
  src: string;
  caption: string;
  category: string;
  date: string;
}

export const galleryData: GalleryItem[] = [
  {
    id: 'gal-1',
    src: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=900&q=80',
    caption: 'Kegiatan belajar mengajar di laboratorium komputer',
    category: 'Akademik',
    date: '2026-07-10'
  },
  {
    id: 'gal-2',
    src: 'https://images.unsplash.com/photo-1552664688-cf1ec3b78476?auto=format&fit=crop&w=900&q=80',
    caption: 'Tim futsal SMKN 11 bertanding di Bupati Cup',
    category: 'Olahraga',
    date: '2026-06-20'
  },
  {
    id: 'gal-3',
    src: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80',
    caption: 'Sosialisasi PPDB oleh panitia sekolah',
    category: 'Kegiatan',
    date: '2026-06-15'
  },
  {
    id: 'gal-4',
    src: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=80',
    caption: 'Upacara bendera hari Senin yang khidmat',
    category: 'Kegiatan',
    date: '2026-06-01'
  },
  {
    id: 'gal-5',
    src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
    caption: 'Siswa TJKT praktik konfigurasi jaringan',
    category: 'Akademik',
    date: '2026-05-20'
  },
  {
    id: 'gal-6',
    src: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=900&q=80',
    caption: 'Kunjungan industri jurusan Teknik Otomotif ke pabrik mobil',
    category: 'Akademik',
    date: '2026-05-10'
  },
  {
    id: 'gal-7',
    src: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
    caption: 'Penampilan seni pada peringatan Hari Guru',
    category: 'Kegiatan',
    date: '2025-11-25'
  },
  {
    id: 'gal-8',
    src: 'https://images.unsplash.com/photo-1574717024653-61f18dee1fb0?auto=format&fit=crop&w=900&q=80',
    caption: 'Kegiatan ekstrakurikuler jurnalistik',
    category: 'Kegiatan',
    date: '2026-04-15'
  },
  {
    id: 'gal-9',
    src: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80',
    caption: 'Praktik perbaikan mesin siswa Teknik Otomotif',
    category: 'Akademik',
    date: '2026-03-12'
  },
  {
    id: 'gal-10',
    src: 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?auto=format&fit=crop&w=900&q=80',
    caption: 'Kegiatan Rohis kajian rutin Jumat berkah',
    category: 'Keagamaan',
    date: '2026-02-18'
  },
  {
    id: 'gal-11',
    src: 'https://images.unsplash.com/photo-1526976668913-0b7520b8c12d?auto=format&fit=crop&w=900&q=80',
    caption: 'Latihan Paskibra Satria 11',
    category: 'Kegiatan',
    date: '2026-01-25'
  },
  {
    id: 'gal-12',
    src: 'https://images.unsplash.com/photo-1576200962002-b08bab9ca72f?auto=format&fit=crop&w=900&q=80',
    caption: 'Latihan taekwondo mingguan',
    category: 'Olahraga',
    date: '2026-01-10'
  }
];

export { galleryData as gallery };
