import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface ApiKeyContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  hasApiKey: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string>(() => {
    // 1. Check Process Env (Dev/Build time or injected)
    if (process.env.API_KEY) return process.env.API_KEY;
    
    // 2. Check Local Storage (Persistence)
    const stored = localStorage.getItem('GOOGLE_API_KEY');
    if (stored) return stored;

    return '';
  });

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    if (key) {
        localStorage.setItem('GOOGLE_API_KEY', key);
    }
  };

  useEffect(() => {
    // 3. Check Window AIStudio property if available on mount
    // We cast window to any here to avoid circular type dependency before global declaration
    const win = window as any;
    if (win.aistudio && win.aistudio.selectedApiKey) {
         setApiKey(win.aistudio.selectedApiKey);
    }
  }, []);

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, hasApiKey: !!apiKey }}>
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = (): ApiKeyContextType => {
  const context = useContext(ApiKeyContext);
  if (!context) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};