import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { UserData, UserContextType } from '../types';

const initialUserData: UserData = {
  nome: '',
  eta: '',
  genere: '',
  problema: '',
  testInduttore: { manoDestra: '', manoSinistra: '' },
  induttoreResult: '',
  testNome: { nomeVero: '', nomeFalso: '' },
  puntiDistonici: {
    famiglia: '',
    sentimentali: '',
    sessuali: '',
    autorealizzazione: '',
  },
  puntoDistonicoFinale: '',
  sigilli: {
    colpa: '',
    abbandono: '',
    disistima: '',
    giudizio: '',
  },
  sigilloFinale: '',
  timeLine: {
    etaEventoCausa: '',
  },
  testimoneChiave: '',
  giornoEvento: '',
  giustificatoTorto: '',
  completedTests: {},
  aiSummary: '',
};

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData>(() => {
    try {
      const savedData = localStorage.getItem('userData');
      if (savedData) {
        // Merge saved data with initial data to ensure all keys are present
        const parsedData = JSON.parse(savedData);
        return { ...initialUserData, ...parsedData };
      }
    } catch (error) {
      console.error("Failed to parse userData from localStorage", error);
    }
    return initialUserData;
  });

  useEffect(() => {
    try {
      localStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to save userData to localStorage", error);
    }
  }, [userData]);

  return (
    <UserContext.Provider value={{ userData, setUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};