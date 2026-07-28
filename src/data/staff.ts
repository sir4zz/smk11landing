export interface Staff {
  id: string;
  name: string;
  position: string;
  department: string;
  photo: string;
}

export const staffData: Staff[] = [
  {
    id: 'staff-1',
    name: 'Drs. H. Ahmad Fauzi, M.Pd.',
    position: 'Kepala Sekolah',
    department: 'Manajemen',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'staff-2',
    name: 'Sri Mulyani, S.Pd., M.Si.',
    position: 'Wakil Kepala Sekolah Bid. Kurikulum',
    department: 'Kurikulum',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'staff-3',
    name: 'Budi Santoso, S.Kom.',
    position: 'Wakil Kepala Sekolah Bid. Kesiswaan',
    department: 'Kesiswaan',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'staff-4',
    name: 'Haryanto, S.T.',
    position: 'Wakil Kepala Sekolah Bid. Sarana Prasarana',
    department: 'Sarana Prasarana',
    photo: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'staff-5',
    name: 'Dra. Rini Wulandari',
    position: 'Wakil Kepala Sekolah Bid. Humas & Hubin',
    department: 'Humas',
    photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'staff-6',
    name: 'Eko Prasetyo, S.Kom.',
    position: 'Kepala Program Keahlian TKJ',
    department: 'Teknik Komputer dan Jaringan',
    photo: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'staff-7',
    name: 'Anita Rahmawati, S.Kom., M.Kom.',
    position: 'Kepala Program Keahlian RPL',
    department: 'Rekayasa Perangkat Lunak',
    photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'staff-8',
    name: 'Asep Saepudin, S.Pd.T.',
    position: 'Kepala Program Keahlian TKR',
    department: 'Teknik Kendaraan Ringan',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'staff-9',
    name: 'Deni Setiawan, S.T.',
    position: 'Kepala Program Keahlian TBSM',
    department: 'Teknik Bisnis Sepeda Motor',
    photo: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'staff-10',
    name: 'Siti Aminah, S.E., M.Ak.',
    position: 'Kepala Program Keahlian AKL',
    department: 'Akuntansi dan Keuangan Lembaga',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80'
  }
];

export const staffStructure = {
  principal: staffData.find(s => s.position === 'Kepala Sekolah')!,
  vicePrincipals: staffData.filter(s => s.position.startsWith('Wakil')),
  departmentHeads: staffData.filter(s => s.position.startsWith('Kepala Program')),
};

export default staffStructure;
