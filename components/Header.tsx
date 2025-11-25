import React from 'react';
import { useHeader } from '../contexts/HeaderContext';

const Header: React.FC = () => {
  const { title, subtitle } = useHeader();
  const isDashboard = title === 'Analogista Virtuale di Max Pisani';

  return (
    <header className="bg-blue-600 text-white p-4 rounded-t-lg shadow-lg text-center">
      <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
      {isDashboard ? (
        <div className="grid grid-cols-3 items-center text-xs sm:text-sm text-blue-200 mt-1">
          <span className="text-left"></span>
          <span className="text-center">{subtitle}</span>
          <span className="text-right font-semibold">In memoria di S.Benemeglio</span>
        </div>
      ) : (
        subtitle && <p className="text-xs sm:text-sm text-blue-200">{subtitle}</p>
      )}
    </header>
  );
};

export default Header;
