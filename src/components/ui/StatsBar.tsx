import React from 'react';

interface Stat {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface StatsBarProps {
  stats: Stat[];
  className?: string;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, className = '' }) => {
  return (
    <div className={`bg-[#1B2A4A] text-[#FAF6F0] py-12 px-4 sm:px-6 w-full ${className}`}>
      <div className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              {stat.icon && (
                <div className="text-[#C8A951] mb-4">
                  {stat.icon}
                </div>
              )}
              <div className="text-3xl md:text-4xl font-bold text-[#C8A951] mb-2">
                {stat.value}
              </div>
              <div className="text-sm md:text-base font-semibold uppercase tracking-[0.2em] text-white">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsBar;
