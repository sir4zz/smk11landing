import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import SearchModal from './SearchModal';

const Layout: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0] font-sans">
      <Navbar onSearchOpen={() => setIsSearchOpen(true)} />
      
      {/* Main content with padding-top to offset fixed navbar */}
      <main className="flex-grow pt-[70px]">
        <Outlet />
      </main>

      <Footer />

      {/* Search Modal */}
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </div>
  );
};

export default Layout;
