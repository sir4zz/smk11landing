import React from 'react';
import { Link } from 'react-router-dom';

interface PageHeroProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export const PageHero: React.FC<PageHeroProps> = ({
  title,
  subtitle,
  backgroundImage,
  breadcrumbs,
}) => {
  return (
    <div 
      className="relative w-full min-h-[150px] md:min-h-[200px] flex items-center bg-[#1B2A4A] text-[#FAF6F0]"
    >
      {backgroundImage && (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div className="absolute inset-0 bg-[#1B2A4A]/80 bg-gradient-to-r from-[#1B2A4A]/90 to-[#1B2A4A]/60" />
        </>
      )}
      
      <div className="container mx-auto px-4 relative z-10 py-10 md:py-16">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
          {title}
        </h1>
        
        {subtitle && (
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mb-6">
            {subtitle}
          </p>
        )}
        
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex text-sm text-[#FAF6F0]" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="inline-flex items-center">
                  {index > 0 && (
                    <span className="mx-2 text-white/50">/</span>
                  )}
                  {crumb.href ? (
                    <Link to={crumb.href} className="hover:text-[#C8A951] transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-[#C8A951] font-medium">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>
    </div>
  );
};

export default PageHero;
