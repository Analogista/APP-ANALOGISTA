
import React from 'react';
import { useHeader } from '../contexts/HeaderContext';
import { Logo } from './Logo';

const Header: React.FC = () => {
  const { title, subtitle } = useHeader();
  const isDashboard = title === 'Analogista Virtuale di Max Pisani';

  return (
    <header className="bg-blue-600 text-white p-4 rounded-t-lg shadow-lg">
      <div className="flex items-center justify-center gap-3 mb-2">
          <div className="bg-white text-blue-600 rounded-full p-1 shadow-md">
            <Logo className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-center leading-tight">{title}</h1>
      </div>
      
      {isDashboard ? (
        <div className="grid grid-cols-3 items-center text-xs sm:text-sm text-blue-200 mt-1 border-t border-blue-500 pt-2">
          <span className="text-left"></span>
          <span className="text-center">{subtitle}</span>
          <span className="text-right font-semibold">In memoria di S.Benemeglio</span>
        </div>
      ) : (
        subtitle && <p className="text-xs sm:text-sm text-blue-200 text-center">{subtitle}</p>
      )}
    </header>
  );
};

export default Header;
