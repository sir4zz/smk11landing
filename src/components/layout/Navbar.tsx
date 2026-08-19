import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { navItems, type NavItem } from '../../data/navigation';
import logoSekolah from '../../assets/logo.png';

const studentSessionKey = 'smkn11-student-session';

interface NavbarProps {
  onSearchOpen: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSearchOpen }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileItem, setExpandedMobileItem] = useState<string | null>(null);
  const [isStudentLoggedIn, setIsStudentLoggedIn] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsStudentLoggedIn(localStorage.getItem(studentSessionKey) === 'true');
  }, [location.pathname]);

  useEffect(() => {
    const handleStorage = () => {
      setIsStudentLoggedIn(localStorage.getItem(studentSessionKey) === 'true');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const visibleNavItems = navItems.map((item) => ({
    ...item,
    children: item.children?.filter((child) => !child.studentOnly || isStudentLoggedIn),
  })).filter((item) => !item.studentOnly || isStudentLoggedIn);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleMobileSubmenu = (label: string) => {
    setExpandedMobileItem(expandedMobileItem === label ? null : label);
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.children) return item.children.some((child) => isItemActive(child));
    return isActive(item.href);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-[64px] bg-[#1B2A4A] text-[#FAF6F0] z-50 shadow-md">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logoSekolah} alt="Logo SMKN 11" className="h-10 w-auto" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
          <div className="flex flex-col">
            <span className="text-white font-bold text-base sm:text-xl leading-tight">SMKN 11</span>
            <span className="text-[#F3E8D0] text-[10px] sm:text-xs hidden sm:block">Kab. Tangerang</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-1 lg:space-x-2">
          {visibleNavItems.map((item) => (
            <div key={item.label} className="relative group">
              {item.children ? (
                <div className="flex items-center cursor-pointer px-2 py-1.5 text-white hover:text-[#C8A951] transition-colors duration-300 ease-in-out">
                  <span className={`${isItemActive(item) ? 'text-[#C8A951]' : ''}`}>{item.label}</span>
                  <ChevronDown size={16} className="ml-1" />
                </div>
              ) : (
                <Link
                  to={item.href}
                  className={`px-2 py-1.5 block transition-all duration-300 ease-in-out ${
                    item.isHighlighted
                      ? 'bg-[#C8A951] text-[#1B2A4A] font-medium rounded hover:bg-opacity-90'
                      : isActive(item.href)
                      ? 'text-[#C8A951] border-b-2 border-[#C8A951]'
                      : 'text-white hover:text-[#C8A951]'
                  }`}
                >
                  {item.label}
                </Link>
              )}

              {/* Dropdown Menu */}
              {item.children && (
                <div className="absolute left-0 top-full opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-in-out min-w-[200px] bg-[#1B2A4A] border border-[#2a3f6e] rounded-b-md shadow-lg py-2">
                  {item.children.map((child) =>
                    child.children ? (
                      <div key={child.label} className="relative group/child px-4 py-2">
                        <div className={`flex items-center justify-between text-sm cursor-pointer ${
                          isItemActive(child) ? 'text-[#C8A951]' : 'text-[#F3E8D0] hover:text-[#C8A951]'
                        } transition-colors duration-300 ease-in-out`}>
                          <span>{child.label}</span>
                          <ChevronRight size={14} className="ml-1" />
                        </div>
                        <div className="absolute left-full top-0 opacity-0 invisible group-hover/child:opacity-100 group-hover/child:visible translate-x-2 group-hover/child:translate-x-0 transition-all duration-300 ease-in-out min-w-[180px] bg-[#1B2A4A] border border-[#2a3f6e] rounded-md shadow-lg py-2">
                          {child.children.map((grandchild) => (
                            <Link
                              key={grandchild.label}
                              to={grandchild.href}
                              className={`block px-4 py-2 text-sm ${
                                isActive(grandchild.href) ? 'text-[#C8A951] bg-[#121c32]' : 'text-[#F3E8D0] hover:text-[#C8A951] hover:bg-[#121c32]'
                              } transition-colors duration-300 ease-in-out`}
                            >
                              {grandchild.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Link
                        key={child.label}
                        to={child.href}
                        className={`block px-4 py-2 text-sm ${
                          isActive(child.href) ? 'text-[#C8A951] bg-[#121c32]' : 'text-[#F3E8D0] hover:text-[#C8A951] hover:bg-[#121c32]'
                        } transition-colors duration-300 ease-in-out`}
                      >
                        {child.label}
                      </Link>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
          
          <button 
            onClick={onSearchOpen}
            className="text-white hover:text-[#C8A951] p-1.5 transition-colors duration-300 ease-in-out ml-1"
            aria-label="Cari"
          >
            <Search size={20} />
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden items-center gap-4">
          <button 
            onClick={onSearchOpen}
            className="text-white hover:text-[#C8A951] transition-colors duration-300 ease-in-out"
            aria-label="Cari"
          >
            <Search size={20} />
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white hover:text-[#C8A951] transition-colors duration-300 ease-in-out p-1"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-[64px] left-0 w-full bg-[#1B2A4A] border-t border-[#2a3f6e] shadow-xl max-h-[calc(100vh-64px)] overflow-y-auto">
          <div className="flex flex-col py-4 px-4 space-y-2">
            {visibleNavItems.map((item) => (
              <div key={item.label} className="border-b border-[#2a3f6e] last:border-0 pb-2">
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleMobileSubmenu(item.label)}
                      className="w-full flex justify-between items-center py-2 text-white"
                    >
                      <span className={`${isItemActive(item) ? 'text-[#C8A951]' : ''}`}>{item.label}</span>
                      {expandedMobileItem === item.label ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    {expandedMobileItem === item.label && (
                      <div className="flex flex-col pl-4 mt-2 space-y-3 pb-2">
                        {item.children.map((child) =>
                          child.children ? (
                            <div key={child.label}>
                              <button
                                onClick={() => toggleMobileSubmenu(`${item.label}:${child.label}`)}
                                className={`w-full flex justify-between items-center text-sm ${
                                  isItemActive(child) ? 'text-[#C8A951]' : 'text-[#F3E8D0]'
                                }`}
                              >
                                <span>{child.label}</span>
                                {expandedMobileItem === `${item.label}:${child.label}` ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </button>
                              {expandedMobileItem === `${item.label}:${child.label}` && (
                                <div className="flex flex-col pl-4 mt-2 space-y-3 pb-2">
                                  {child.children.map((grandchild) => (
                                    <Link
                                      key={grandchild.label}
                                      to={grandchild.href}
                                      className={`text-sm ${isActive(grandchild.href) ? 'text-[#C8A951]' : 'text-[#F3E8D0]'}`}
                                    >
                                      {grandchild.label}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Link
                              key={child.label}
                              to={child.href}
                              className={`text-sm ${isActive(child.href) ? 'text-[#C8A951]' : 'text-[#F3E8D0]'}`}
                            >
                              {child.label}
                            </Link>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.href}
                    className={`block py-2 transition-colors duration-300 ease-in-out ${
                      item.isHighlighted
                        ? 'bg-[#C8A951] text-[#1B2A4A] text-center font-medium rounded mt-2'
                        : isActive(item.href)
                        ? 'text-[#C8A951]'
                        : 'text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
