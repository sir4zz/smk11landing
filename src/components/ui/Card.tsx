import React from 'react';
import { Link } from 'react-router-dom';

interface CardProps {
  image?: string;
  title?: string;
  description?: string;
  badge?: string;
  tag?: string;
  tagClassName?: string;
  link?: string;
  className?: string;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  image,
  title,
  description,
  badge,
  tag,
  tagClassName = 'bg-[#1B2A4A]/80 text-white',
  link,
  className = '',
  children,
}) => {
  const CardContent = (
    <div className={`flex flex-col overflow-hidden rounded-[1.25rem] border border-[#1B2A4A]/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${className}`}>
      {children ? children : (
        <>
          {image && (
            <div className="relative h-48 w-full overflow-hidden">
              <img src={image} alt={title} loading="lazy" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A4A]/70 to-transparent" />
              {tag && (
                <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${tagClassName}`}>
                  {tag}
                </span>
              )}
              {badge && (
                <span className="absolute right-3 top-3 rounded-full bg-[#C8A951] px-3 py-1 text-xs font-semibold text-[#1B2A4A]">
                  {badge}
                </span>
              )}
            </div>
          )}
          <div className={`p-6 ${!image && badge ? 'relative' : ''}`}>
            {!image && badge && (
              <span className="absolute right-4 top-4 rounded-full bg-[#C8A951] px-3 py-1 text-xs font-semibold text-[#1B2A4A]">
                {badge}
              </span>
            )}
            <h3 className="mb-2 text-xl font-semibold text-[#1B2A4A]">{title}</h3>
            <p className="text-sm leading-6 font-medium text-[#23314D] line-clamp-3">{description}</p>
          </div>
        </>
      )}
    </div>
  );

  if (link) {
    return (
      <Link to={link} className="block h-full w-full">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
};

export default Card;
