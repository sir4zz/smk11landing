import React from 'react';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  center?: boolean;
  variant?: 'dark' | 'light';
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  subtitle,
  align = 'left',
  center = false,
  variant = 'dark',
  className = '',
}) => {
  const isCentered = center || align === 'center';

  return (
    <div className={`mb-8 ${isCentered ? 'text-center flex flex-col items-center' : 'text-left'} ${className}`}>
      <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${variant === 'light' ? 'text-white' : 'text-[#1B2A4A]'}`}>{title}</h2>
      <div className={`w-16 h-1 bg-[#C8A951] rounded-full mb-4 ${isCentered ? 'mx-auto' : ''}`} />
      {subtitle && (
        <p className={`max-w-2xl text-base font-medium ${variant === 'light' ? 'text-[#F3E8D0]' : 'text-[#23314D]'}`}>{subtitle}</p>
      )}
    </div>
  );
};

export default SectionHeading;
