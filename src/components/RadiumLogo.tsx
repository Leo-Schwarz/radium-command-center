import React from 'react';

interface RadiumLogoProps {
  className?: string;
  height?: number;
}

const RadiumLogo: React.FC<RadiumLogoProps> = ({ className = '', height = 28 }) => {
  return (
    <svg
      viewBox="0 0 200 48"
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Square box around Ra */}
      <rect x="1" y="1" width="36" height="36" rx="4" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
      
      {/* Ra text inside box */}
      <text
        x="19"
        y="28"
        textAnchor="middle"
        fill="currentColor"
        fontSize="20"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="400"
        opacity="0.9"
      >
        Ra
      </text>
      
      {/* radium text */}
      <text
        x="0"
        y="45"
        fill="currentColor"
        fontSize="11"
        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontWeight="500"
        letterSpacing="0.15em"
        opacity="0.45"
      >
        radium
      </text>
    </svg>
  );
};

export default RadiumLogo;