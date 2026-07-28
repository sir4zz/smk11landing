import React, { useEffect, useState } from 'react';
import PageHero from '../../components/ui/PageHero';
import { User } from 'lucide-react';

// Fallback staff data in case the actual staff data file is not available
// We still attempt to import it as per requirement
import { staffData } from '../../data/staff';
import { fetchPublicContent } from '../../lib/api';

const principalFallback = staffData.find(item => item.position === 'Kepala Sekolah') || { name: 'Drs. H. Kepala Sekolah, M.Pd.', position: 'Kepala Sekolah' };
const AvatarPlaceholder: React.FC = () => (
  <div className="w-24 h-24 rounded-full bg-[#1B2A4A] text-white flex items-center justify-center mx-auto mb-4 border-4 border-[#FAF6F0] shadow-sm">
    <User size={40} />
  </div>
);

const OrganizationStructure: React.FC = () => {
  const [staff, setStaff] = useState(staffData);
  useEffect(() => { fetchPublicContent('staff', staffData).then(setStaff); }, []);
  const principal = staff.find(item => item.position === 'Kepala Sekolah') || principalFallback;
  const vicePrincipals = staff.filter(item => item.position.startsWith('Wakil'));
  const departmentHeads = staff.filter(item => item.position.startsWith('Kepala Program'));
  return (
    <main className="bg-[#FAF6F0] min-h-screen">
      <PageHero 
        title="Struktur Organisasi" 
        subtitle="Jajaran pimpinan dan pengelola SMKN 11 Kabupaten Tangerang" 
        backgroundImage="https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1600&q=80"
      />
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Principal */}
        <div className="mb-16">
          <div className="bg-[#1B2A4A] max-w-md mx-auto rounded-xl p-8 text-center shadow-lg text-white">
            <div className="w-32 h-32 rounded-full bg-white text-[#1B2A4A] flex items-center justify-center mx-auto mb-6 border-4 border-[#C8A951]">
              <User size={56} />
            </div>
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
                <AvatarPlaceholder />
                <h4 className="font-bold text-[#1B2A4A] text-lg mb-1">{vp.name}</h4>
                <p className="text-[#23314D] text-sm">{vp.position}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Department Heads */}
        <div>
          <h2 className="text-2xl font-bold text-[#1B2A4A] text-center mb-10 pb-4">Kepala Program Keahlian</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {departmentHeads.map((head, index) => (
              <div key={index} className="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                <AvatarPlaceholder />
                <span className="inline-block px-3 py-1 bg-[#FAF6F0] text-[#1B2A4A] text-xs font-bold rounded-full mb-3">
                  {head.department}
                </span>
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
