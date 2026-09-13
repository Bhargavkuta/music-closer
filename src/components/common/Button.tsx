import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'active';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg select-none focus:outline-none focus:ring-2 focus:ring-accent-primary/40 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100";

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
    icon: 'p-2 aspect-square',
  };

  const variantStyles = {
    primary: 'bg-accent-primary hover:bg-accent-hover text-white shadow-sm shadow-accent-primary/25 border border-indigo-500/30',
    secondary: 'bg-studio-800 hover:bg-studio-750 text-studio-200 hover:text-white border border-studio-700/60 shadow-sm',
    ghost: 'text-studio-300 hover:text-white hover:bg-studio-800/60',
    accent: 'bg-gradient-to-r from-indigo-500 to-accent-secondary hover:opacity-95 text-white shadow-md shadow-indigo-500/20',
    active: 'bg-accent-primary/20 text-accent-primary border border-accent-primary/40 font-semibold',
    danger: 'bg-rose-950/40 text-rose-300 border border-rose-800/40 hover:bg-rose-900/50 hover:text-white',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
      {...props}
    >
      {children}
    </button>
  );
};
