export interface EducationStaff {
  id: string;
  name: string;
  position: string;
  department: string;
  photo: string;
}

export const educationStaffData: EducationStaff[] = [
  {
    id: 'ed-1',
    name: 'Hj. Yuli Astuti, S.E.',
    position: 'Kepala Tata Usaha',
    department: 'Tata Usaha',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'ed-2',
    name: 'Dede Firmansyah',
    position: 'Operator Sekolah (Dapodik)',
    department: 'Tata Usaha',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'ed-3',
    name: 'Rina Kartika, S.Pd.',
    position: 'Pustakawan',
    department: 'Perpustakaan',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'ed-4',
    name: 'Maman Suherman',
    position: 'Staf Perpustakaan',
    department: 'Perpustakaan',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'ed-5',
    name: 'Yusuf Hidayat, A.Md.',
    position: 'Laboran',
    department: 'Laboratorium',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'ed-6',
    name: 'Titi Maryati',
    position: 'Staf Kesiswaan',
    department: 'Kesiswaan',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'ed-7',
    name: 'Ahmad Rifai',
    position: 'Staf Sarana Prasarana',
    department: 'Sarana Prasarana',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'ed-8',
    name: 'Siti Nurhaliza, A.Md.',
    position: 'Staf Humas',
    department: 'Humas',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
  },
];

export { educationStaffData as educationStaff };
