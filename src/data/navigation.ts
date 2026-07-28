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
    label: 'Kesiswaan',
    href: '/kesiswaan',
    children: [
      { label: 'Prestasi', href: '/kesiswaan/prestasi' },
      { label: 'Ekstrakurikuler', href: '/kesiswaan/ekstrakurikuler' },
      { label: 'Galeri', href: '/kesiswaan/galeri' },
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
  { label: 'PPDB', href: '/ppdb', isHighlighted: true },
  { label: 'Kontak', href: '/kontak' },
];

export { navigationData as navItems };
