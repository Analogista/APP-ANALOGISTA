import React, { createContext, useState, useContext, ReactNode } from 'react';

interface HeaderContextType {
  title: string;
  subtitle: string | null;
  setHeader: (title: string, subtitle?: string | null) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [title, setTitle] = useState('Analogista Virtuale di Max Pisani');
  const [subtitle, setSubtitle] = useState<string | null>('Copyright 2025');

  const setHeader = (newTitle: string, newSubtitle: string | null = null) => {
    setTitle(newTitle);
    setSubtitle(newSubtitle);
  };

  return (
    <HeaderContext.Provider value={{ title, subtitle, setHeader }}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeader = (): HeaderContextType => {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
};
