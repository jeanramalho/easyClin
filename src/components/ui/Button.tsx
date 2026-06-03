import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', className = '', children, ...rest }) => {
  const base = 'inline-flex items-center justify-center font-bold rounded-xl transition-colors disabled:opacity-50';
  const variants: Record<Variant, string> = {
    primary: 'bg-primary hover:bg-primary-container text-on-primary',
    secondary: 'bg-surface-container border border-outline-variant text-on-surface',
    ghost: 'bg-transparent text-primary'
  };
  const sizes: Record<string, string> = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-4 text-sm',
    lg: 'py-3 px-5 text-base'
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </button>
  );
};

export default Button;
