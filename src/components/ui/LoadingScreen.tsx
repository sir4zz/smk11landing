import React from 'react';
import { SkeletonPage, Skeleton } from './Skeleton';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = () => <SkeletonPage />;

interface LoadingInlineProps {
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingInline: React.FC<LoadingInlineProps> = ({ size = 'md' }) => {
  const sizes = { sm: 'h-2 w-12', md: 'h-3 w-20', lg: 'h-4 w-28' };
  return (
    <div className="flex items-center justify-center" aria-label="Memuat" aria-busy="true">
      <Skeleton className={sizes[size]} />
    </div>
  );
};

export default LoadingScreen;
