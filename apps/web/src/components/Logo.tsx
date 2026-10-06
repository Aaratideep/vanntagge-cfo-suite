import React from 'react';

interface LogoProps {
  variant?: 'light' | 'dark' | 'full';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showSubtitle = true,
}) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-20',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official Image Logo */}
      <img
        src="/vanntagge-logo.png"
        alt="VANNTAGGE CFO SERVICES LLP"
        className={`${sizeClasses[size]} w-auto object-contain bg-white rounded-lg p-1 shadow-xs border border-slate-200/50`}
        onError={(e) => {
          // Fallback if image load has issue
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};
