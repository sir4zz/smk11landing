import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { fetchHomeContent } from '../../lib/api';
import logoSekolah from '../../assets/logo.png';

const InstagramIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const TiktokIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const DEFAULT_SOCIAL = {
  instagram: 'https://instagram.com/smkn11kabtangerang',
  facebook: 'https://facebook.com/smkn11kabtangerang',
  tiktok: 'https://tiktok.com/@smkn11kabtangerang',
  email: 'admin@smkn11kabtang.sch.id',
};

const Footer: React.FC = () => {
  const [social, setSocial] = useState(DEFAULT_SOCIAL);

  useEffect(() => {
    fetchHomeContent().then((home) => {
      if (home?.social) {
        setSocial({ ...DEFAULT_SOCIAL, ...home.social });
      }
    }).catch(() => {});
  }, []);

  const socialLinks = [
    {
      label: 'Instagram',
      href: social.instagram,
      icon: <InstagramIcon />,
    },
    {
      label: 'Facebook',
      href: social.facebook,
      icon: <FacebookIcon />,
    },
    {
      label: 'TikTok',
      href: social.tiktok,
      icon: <TiktokIcon />,
    },
    {
      label: 'Email Sekolah',
      href: social.email.startsWith('mailto:') ? social.email : `mailto:${social.email}`,
      icon: <Mail size={20} />,
    },
  ].filter((item) => item.href.trim());

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
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel={item.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                  aria-label={item.label}
                  title={item.label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-[#F3E8D0] transition-colors hover:border-[#C8A951] hover:bg-[#C8A951] hover:text-[#1B2A4A]"
                >
                  {item.icon}
                </a>
              ))}
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
              <li><Link to="/spmb" className="text-[#F3E8D0] hover:text-white transition-colors">Informasi SPMB</Link></li>
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
