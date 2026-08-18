export interface NavItem {
    label: string;
    href: string;
    children?: NavItem[];
    isHighlighted?: boolean;
    studentOnly?: boolean;
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
        ],
    },
    {
        label: 'Informasi',
        href: '/informasi',
        children: [
            { label: 'Berita', href: '/informasi/berita' },
            { label: 'FAQ', href: '/informasi/faq' },
            { label: 'Galeri', href: '/galeri' },
            { label: 'Kontak', href: '/kontak' },
        ],
    },
    //{ label: 'Galeri', href: '/galeri' },
    {
        label: 'Ruang Siswa',
        href: '/osis',
        children: [
            { label: 'Data Diri', href: '/siswa/data-diri', studentOnly: true },
            {
                label: 'OSIS',
                href: '/osis',
                children: [
                    { label: 'Profil OSIS', href: '/osis' },
                    { label: 'Struktur OSIS', href: '/osis/struktur' },
                    { label: 'Kegiatan OSIS', href: '/osis/kegiatan' },
                ],
            },
            { label: 'Ekstrakurikuler', href: '/osis/ekstrakurikuler' },
            { label: 'Kesemaptaan', href: '/osis/kesemaptaan' },
            { label: 'Mading', href: '/mading' },
            { label: 'Prestasi Siswa', href: '/kesiswaan/prestasi' },
        ],
    },
    {
        label: 'BKK',
        href: '/bkk',
        children: [
            { label: 'Beranda BKK', href: '/bkk' },
            { label: 'Lowongan Kerja', href: '/bkk/lowongan' },
            { label: 'Kelulusan Siswa', href: '/bkk/kelulusan' },
            { label: 'Kontak BKK', href: '/bkk/kontak' },
        ],
    },
    { label: 'SPMB', href: '/spmb', isHighlighted: true },
];

export { navigationData as navItems };
