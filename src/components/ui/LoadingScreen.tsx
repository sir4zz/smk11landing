import React from 'react';
import logoSekolah from '../../assets/logo.png';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Memuat...' }) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF6F0]">
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-[#C8A951]/20" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
          <img src={logoSekolah} alt="SMKN 11" className="h-12 w-auto object-contain" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#C8A951]" style={{ animationDelay: '0ms' }} />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#C8A951]" style={{ animationDelay: '150ms' }} />
          <span className="h-2 w-2 animate-bounce rounded-full bg-[#C8A951]" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-sm font-medium text-[#866D2C] tracking-wider">{message}</p>
      </div>
    </div>
  </div>
);

interface LoadingInlineProps {
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingInline: React.FC<LoadingInlineProps> = ({ size = 'md' }) => {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };
  return (
    <div className="flex items-center justify-center">
      <div className={`${sizes[size]} animate-spin rounded-full border-2 border-[#C8A951] border-t-transparent`} />
    </div>
  );
};

export default LoadingScreen;
