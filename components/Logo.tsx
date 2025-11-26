
import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    aria-label="Logo Analogista Virtuale"
  >
    {/* Cerchio esterno sfumato (Contenitore della psiche) */}
    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" className="opacity-30" />
    
    {/* Spirale Analogica (Viaggio nell'inconscio) */}
    <path 
        d="M50 15 
           C 25 15, 15 40, 15 50 
           C 15 75, 35 85, 50 85 
           C 70 85, 85 70, 85 50 
           C 85 35, 65 28, 50 28 
           C 40 28, 32 38, 32 50 
           C 32 60, 42 62, 50 62" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    />
    
    {/* Punto centrale (Il nucleo/l'essenza) */}
    <circle cx="50" cy="50" r="6" fill="currentColor" />
  </svg>
);

export default Logo;
