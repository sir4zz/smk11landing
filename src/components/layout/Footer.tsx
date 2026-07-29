import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Send, Play, MapPin, Phone, Mail } from 'lucide-react';
import logoSekolah from '../../assets/logo.png';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1B2A4A] text-[#FAF6F0] pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Column 1: School Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logoSekolah} alt="Logo SMKN 11" className="h-10 w-auto" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
              <div className="flex flex-col">
                <span className="font-bold text-xl leading-tight">SMKN 11</span>
                <span className="text-sm text-[#F5E9CF]">Kabupaten Tangerang</span>
              </div>
            </div>
            <p className="text-[#F3E8D0] text-sm leading-relaxed mb-6">
              Mendidik generasi unggul, berkarakter, dan berdaya saing global melalui pendidikan vokasi yang inovatif.
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-[#F3E8D0] hover:text-[#C8A951] transition-colors">
                <Globe size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-[#F3E8D0] hover:text-[#C8A951] transition-colors">
                <Send size={20} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-[#F3E8D0] hover:text-[#C8A951] transition-colors">
                <Play size={20} />
              </a>
            </div>
          </div>

          {/* Column 2: Tautan Cepat */}
          <div>
            <h3 className="text-[#C8A951] font-bold text-lg mb-4">Tautan Cepat</h3>
            <ul className="space-y-2">
              <li><Link to="/profil/sejarah" className="text-[#F3E8D0] hover:text-white transition-colors">Profil Sekolah</Link></li>
              <li><Link to="/akademik/program-keahlian" className="text-[#F3E8D0] hover:text-white transition-colors">Program Keahlian</Link></li>
              <li><Link to="/kesiswaan/prestasi" className="text-[#F3E8D0] hover:text-white transition-colors">Kesiswaan</Link></li>
              <li><Link to="/informasi/berita" className="text-[#F3E8D0] hover:text-white transition-colors">Berita & Pengumuman</Link></li>
              <li><Link to="/ppdb" className="text-[#F3E8D0] hover:text-white transition-colors">Informasi PPDB</Link></li>
              <li><Link to="/kontak" className="text-[#F3E8D0] hover:text-white transition-colors">Hubungi Kami</Link></li>
            </ul>
          </div>

          {/* Column 3: Program Keahlian */}
          <div>
            <h3 className="text-[#C8A951] font-bold text-lg mb-4">Program Keahlian</h3>
            <ul className="space-y-2">
              <li className="text-[#F3E8D0]">Teknik Jaringan Komputer dan Telekomunikasi</li>
              <li className="text-[#F3E8D0]">Desain Komunikasi Visual</li>
              <li className="text-[#F3E8D0]">Teknik Otomotif</li>
              <li className="text-[#F3E8D0]">Teknik Ketenagalistrikan</li>
              <li className="text-[#F3E8D0]">Manajemen Perkantoran dan Layanan Bisnis</li>
              <li className="text-[#F3E8D0]">Busana</li>
            </ul>
          </div>

          {/* Column 4: Kontak */}
          <div>
            <h3 className="text-[#C8A951] font-bold text-lg mb-4">Kontak</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="text-[#C8A951] shrink-0 mt-1" size={18} />
                <span className="text-[#F3E8D0] text-sm">Kp. Saradan RT. 03/01, Desa Pangkat, Kec. Jayanti, Kab. Tangerang, Banten 15610</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-[#C8A951] shrink-0" size={18} />
                <span className="text-[#F3E8D0] text-sm">0812 9922 0831</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-[#C8A951] shrink-0" size={18} />
                <span className="text-[#F3E8D0] text-sm">admin@smkn11kabtang.sch.id</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#2a3f6e] text-center">
          <p className="text-[#E8DCC7] text-sm">
            &copy; 2026 SMKN 11 Kabupaten Tangerang. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
