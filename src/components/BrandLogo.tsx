import React from 'react';

export const BrandLogo: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    aria-label="Sanjeevini Health Camp System Logo"
  >
    <rect width="64" height="64" rx="14" fill="#0e7c66" />
    <path
      d="M28 12C28 9.79086 29.7909 8 32 8C34.2091 8 36 9.79086 36 12V28H52C54.2091 28 56 29.7909 56 32C56 34.2091 54.2091 36 52 36H36V52C36 54.2091 34.2091 56 32 56C29.7909 56 28 54.2091 28 52V36H12C9.79086 36 8 34.2091 8 32C8 29.7909 9.79086 28 12 28H28V12Z"
      fill="#ffffff"
    />
    <circle cx="32" cy="32" r="11" stroke="#f2994a" strokeWidth="4.5" fill="none" />
  </svg>
);
