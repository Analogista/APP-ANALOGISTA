import React from 'react';
import { Tab } from '../App';

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const NavItem: React.FC<{
  Icon: React.ReactElement;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ Icon, label, isActive, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}>
    <div className={isActive ? 'animate-bounce-short' : ''}>
      {Icon}
    </div>
    <span className="text-xs font-medium">{label}</span>
  </button>
);

const HomeIcon: React.FC<{ isActive: boolean }> = ({ isActive }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={isActive ? '#2563EB' : '#6B7280'}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.5 1.5 0 012.122 0l8.954 8.955M2.25 12v8.25a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75v-4.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v4.5a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75V12m-18 0l-1.372-1.372a1.5 1.5 0 010-2.122l1.372-1.372M21.75 12l1.372-1.372a1.5 1.5 0 000-2.122l-1.372-1.372" />
    </svg>
);
const ResultsIcon: React.FC<{ isActive: boolean }> = ({ isActive }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke={isActive ? '#2563EB' : '#6B7280'}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
);
const ContactIcon: React.FC<{ isActive: boolean }> = ({ isActive }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke={isActive ? '#2563EB' : '#6B7280'}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
);

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-4xl mx-auto h-16 bg-white border-t border-gray-200 flex justify-around shadow-[0_-2px_5px_rgba(0,0,0,0.05)]">
      <NavItem Icon={<HomeIcon isActive={activeTab === 'home'} />} label="Home" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
      <NavItem Icon={<ResultsIcon isActive={activeTab === 'risultati'} />} label="Risultati" isActive={activeTab === 'risultati'} onClick={() => setActiveTab('risultati')} />
      <NavItem Icon={<ContactIcon isActive={activeTab === 'contatti'} />} label="Contatti" isActive={activeTab === 'contatti'} onClick={() => setActiveTab('contatti')} />
    </nav>
  );
};

export default BottomNav;