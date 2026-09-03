import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-[#0f0f11] border border-gray-200 dark:border-white/[0.08] rounded-xl transition-colors duration-200
        ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-[#161618] hover:border-gray-300 dark:hover:border-white/[0.14]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;
