import React, { useEffect, useState } from 'react';
import PageHero from '../../components/ui/PageHero';
import { User } from 'lucide-react';
import { staffData, type Staff } from '../../data/staff';
import { fetchPublicContent, publicProfileApi, type PublicDirectoryEntry } from '../../lib/api';

interface Person {
  name: string;
  position: string;
  department?: string;
  photo?: string;
}

const principalFallback: Person = staffData.find(item => item.position === 'Kepala Sekolah') || { name: 'Drs. H. Kepala Sekolah, M.Pd.', position: 'Kepala Sekolah', photo: '' };

const Fallback: React.FC<{ photo?: string; size?: 'lg' | 'md'; alt: string }> = ({ photo, size = 'md', alt }) => (
  <div className={`mx-auto mb-4 ${size === 'lg' ? 'h-32 w-32' : 'h-24 w-24'} flex items-center justify-center overflow-hidden rounded-full bg-[#1B2A4A] text-white ${size === 'lg' ? 'border-4 border-[#C8A951]' : 'border-4 border-[#FAF6F0]'} shadow-sm`}>
    {photo ? <img src={photo} alt={alt} className="h-full w-full object-cover" /> : <User size={size === 'lg' ? 56 : 40} />}
  </div>
);

const OrganizationStructure: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>(staffData);
  const [gurus, setGurus] = useState<PublicDirectoryEntry[]>([]);
  useEffect(() => {
    void fetchPublicContent('staff', staffData).then(setStaff);
    publicProfileApi.directory().then(({ data }) => { if (data) setGurus(data.gurus); });
  }, []);

  const guruPeople: Person[] = gurus.map((g) => ({
    name: g.name,
    position: g.position || g.subject || 'Guru',
    department: g.position?.startsWith('Kepala Program') ? g.subject || g.position : g.subject || undefined,
    photo: g.photo,
  }));

  const staffPeople: Person[] = staff.map((s) => ({ name: s.name, position: s.position, department: s.department, photo: s.photo }));
  const allPeople = [...guruPeople, ...staffPeople];
  const dedupe = (list: Person[]) => {
    const seen = new Set<string>();
    return list.filter((p) => { const key = p.name.trim().toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; });
  };

  const principal = allPeople.find((p) => p.position === 'Kepala Sekolah') || principalFallback;
  const vicePrincipals = dedupe(allPeople.filter((p) => p.position.startsWith('Wakil')));
  const departmentHeads = dedupe(allPeople.filter((p) => p.position.startsWith('Kepala Program')));
  const teachers = dedupe(
    guruPeople.filter((p) => p.position !== 'Kepala Sekolah' && !p.position.startsWith('Wakil') && !p.position.startsWith('Kepala Program'))
  );

  return (
    <main className="bg-[#FAF6F0] min-h-screen">
      <PageHero
        title="Struktur Organisasi"
        subtitle="Jajaran pimpinan, pengelola, dan guru SMKN 11 Kabupaten Tangerang"
        backgroundImage="https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1600&q=80"
      />
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

        {/* Principal */}
        <div className="mb-16">
          <div className="bg-[#1B2A4A] max-w-md mx-auto rounded-xl p-8 text-center shadow-lg text-white">
            <Fallback photo={principal.photo} size="lg" alt={principal.name} />
            <h3 className="text-2xl font-bold mb-2">{principal.name}</h3>
            <p className="text-[#C8A951] font-medium text-lg">{principal.position}</p>
          </div>
        </div>

        {/* Vice Principals */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[#1B2A4A] text-center mb-10 pb-4">Wakil Kepala Sekolah</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {vicePrincipals.map((vp, index) => (
              <div key={index} className="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                <Fallback photo={vp.photo} alt={vp.name} />
                <h4 className="font-bold text-[#1B2A4A] text-lg mb-1">{vp.name}</h4>
                <p className="text-[#23314D] text-sm">{vp.position}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Department Heads */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[#1B2A4A] text-center mb-10 pb-4">Kepala Program Keahlian</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {departmentHeads.map((head, index) => (
              <div key={index} className="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                <Fallback photo={head.photo} alt={head.name} />
                {head.department && <span className="inline-block px-3 py-1 bg-[#FAF6F0] text-[#1B2A4A] text-xs font-bold rounded-full mb-3">{head.department}</span>}
                <h4 className="font-bold text-[#1B2A4A] text-base mb-1">{head.name}</h4>
                <p className="text-gray-600 text-xs">{head.position}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Teachers / Gurus */}
        <div>
          <h2 className="text-2xl font-bold text-[#1B2A4A] text-center mb-10 pb-4">Guru &amp; Tenaga Pendidik</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {teachers.map((head, index) => (
              <div key={index} className="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                <Fallback photo={head.photo} alt={head.name} />
                {head.department && <span className="inline-block px-3 py-1 bg-[#FAF6F0] text-[#1B2A4A] text-xs font-bold rounded-full mb-3">{head.department}</span>}
                <h4 className="font-bold text-[#1B2A4A] text-base mb-1">{head.name}</h4>
                <p className="text-gray-600 text-xs">{head.position}</p>
              </div>
            ))}
          </div>
        </div>

      </section>
    </main>
  );
};

export default OrganizationStructure;
