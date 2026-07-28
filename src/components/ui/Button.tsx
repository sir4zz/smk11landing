import React from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'outline-light' | 'solid-navy';
  size?: 'sm' | 'md' | 'lg';
  as?: 'button' | 'link';
  href?: string;
  className?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  as = 'button',
  href,
  className = '',
  style,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C8A951]';
  
  const variants = {
    primary: 'bg-[#C8A951] text-[#1B2A4A] hover:bg-[#B59640]',
    secondary: 'bg-transparent border-2 border-[#1B2A4A] text-[#1B2A4A] hover:bg-[#1B2A4A]/5',
    outline: 'bg-transparent border-2 border-[#1B2A4A] text-[#1B2A4A] hover:bg-[#1B2A4A] hover:text-[#FAF6F0]',
    ghost: 'bg-transparent text-[#1B2A4A] hover:bg-[#1B2A4A]/5',
    // For use on dark/navy backgrounds (e.g. hero sections) — kept as its own
    // variant instead of overriding `secondary` via className, since two
    // conflicting text-color utilities on the same element have an
    // unreliable winner depending on Tailwind's generated CSS order.
    'outline-light': 'bg-transparent border-2 border-[#FAF6F0] text-[#FAF6F0] hover:bg-[#FAF6F0]/10',
    'solid-navy': 'bg-[#1B2A4A] text-[#FAF6F0] hover:bg-[#131d33]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const combinedClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  if (as === 'link' && href) {
    return (
      <Link to={href} className={combinedClasses} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} style={style} {...props}>
      {children}
    </button>
  );
};

export default Button;
