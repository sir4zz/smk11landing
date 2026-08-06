export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
  isHighlighted?: boolean;
}

export const navigationData: NavItem[] = [
  { label: 'Beranda', href: '/' },
  {
    label: 'Profil',
    href: '/profil',
    children: [
      { label: 'Sejarah', href: '/profil/sejarah' },
      { label: 'Visi & Misi', href: '/profil/visi-misi' },
      { label: 'Struktur Organisasi', href: '/profil/struktur-organisasi' },
    ],
  },
  {
    label: 'Akademik',
    href: '/akademik',
    children: [
      { label: 'Program Keahlian', href: '/akademik/program-keahlian' },
      { label: 'Fasilitas', href: '/akademik/fasilitas' },
    ],
  },
  {
    label: 'Manajemen',
    href: '/manajemen',
    children: [
      { label: 'Kepala Sekolah', href: '/manajemen/kepala-sekolah' },
      { label: 'Wakil Kepala Sekolah', href: '/manajemen/wakil-kepala-sekolah' },
      { label: 'Kegiatan Guru', href: '/manajemen/kegiatan-guru' },
      { label: 'Tenaga Kependidikan', href: '/manajemen/tenaga-kependidikan' },
      { label: 'Struktur Manajemen', href: '/manajemen/struktur-manajemen' },
    ],
  },
  {
    label: 'Informasi',
    href: '/informasi',
    children: [
      { label: 'Berita', href: '/informasi/berita' },
      { label: 'FAQ', href: '/informasi/faq' },
    ],
  },
  { label: 'Galeri', href: '/galeri' },
  {
    label: 'OSIS',
    href: '/osis',
    children: [
      { label: 'Profil OSIS', href: '/osis' },
      { label: 'Struktur OSIS', href: '/osis#struktur' },
      { label: 'Kegiatan OSIS', href: '/osis#kegiatan' },
      { label: 'Ekstrakurikuler', href: '/osis/ekstrakurikuler' },
      { label: 'Kesemaptaan', href: '/osis/kesemaptaan' },
    ],
  },
  { label: 'Mading', href: '/mading' },
  { label: 'SPMB', href: '/spmb', isHighlighted: true },
  { label: 'Kontak', href: '/kontak' },
];

export { navigationData as navItems };
