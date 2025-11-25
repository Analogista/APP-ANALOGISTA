
import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { useHeader } from '../contexts/HeaderContext';

import ChiSono from './ChiSono';
import Introduzione from './Introduzione';
import LaTecnica from './LaTecnica';
import ChiSei from './ChiSei';
import CalibrazioneScreen from './CalibrazioneScreen';
import TestInduttore from './TestInduttore';
import TestNome from './TestNome';
import TestPuntiDistonici from './TestPuntiDistonici';
import TestSigilliVincoli from './TestSigilliVincoli';
import CalcolaTimeLine from './CalcolaTimeLine';
import TestimoneChiave from './TestimoneChiave';
import QualeGiorno from './QualeGiorno';
import InfoBox from '../components/InfoBox';

interface ScreenProps {
  setPage: (page: number) => void;
}

interface TestItem {
  id: string;
  title: string;
  description: string;
  component: React.FC<ScreenProps>;
  icon: string;
  isInfo?: boolean;
}

const tests: TestItem[] = [
  { id: 'chiSono', title: '1) Chi sono', description: 'Max Pisani Analogista', component: ChiSono, icon: '🌟', isInfo: true },
  { id: 'introduzione', title: '2) Introduzione', description: 'Le Discipline Analogiche.', component: Introduzione, icon: 'ℹ️', isInfo: true },
  { id: 'laTecnica', title: '3) La Tecnica', description: 'Come funziona questa tecnica.', component: LaTecnica, icon: '⚙️', isInfo: true },
  { id: 'calibrazione', title: '4) Calibrazione', description: 'Prepara il sistema al test.', component: CalibrazioneScreen, icon: '🎯', isInfo: true },
  { id: 'chiSei', title: '5) I tuoi dati', description: 'Nome, età, sesso, problema', component: ChiSei, icon: '👤' },
  { id: 'induttore', title: '6) Test Induttore mano dx e sx', description: 'Scopri se sei in fase "Trasgressiva" o "Istituzionale".', component: TestInduttore, icon: '👋' },
  { id: 'nome', title: '7) Test Nome', description: 'Il tuo inconscio ti riconosce?', component: TestNome, icon: '🆔' },
  { id: 'puntiDistonici', title: '8) Test Punti Distonici', description: 'Identifica le aree di disagio.', component: TestPuntiDistonici, icon: '🎯' },
  { id: 'sigilli', title: '9) Test Sigilli-Vincoli', description: 'Scopri i blocchi emotivi presenti.', component: TestSigilliVincoli, icon: '🔐' },
  { id: 'timeLine', title: '10) Quando accadde?', description: 'vai indietro nel tempo', component: CalcolaTimeLine, icon: '⏳' },
  { id: 'testimone', title: '11) Il Testimone Chiave', description: 'Da chi subisti il torto?', component: TestimoneChiave, icon: '🔍' },
  { id: 'qualeGiorno', title: '12) Quale giorno accadde?', description: 'Individua il giorno esatto dell\'evento.', component: QualeGiorno, icon: '📅' },
];


const Dashboard: React.FC = () => {
  const { userData } = useUser();
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const { setHeader } = useHeader();

  useEffect(() => {
    if (activeTest) {
      const test = tests.find(t => t.id === activeTest);
      if (test) {
        setHeader(test.title, test.description);
      }
    } else {
      setHeader('Analogista Virtuale di Max Pisani', 'Copyright 2025');
    }
  }, [activeTest, setHeader]);
  

  const handleNavigation = (destination: number) => {
    if (destination === 0) { // Go home
      setActiveTest(null);
      return;
    }

    if (destination === 1) { // Go next
      if (!activeTest) return;
      
      const currentIndex = tests.findIndex(t => t.id === activeTest);
      if (currentIndex !== -1 && currentIndex < tests.length - 1) {
        const nextTest = tests[currentIndex + 1];
        if (nextTest) {
          setActiveTest(nextTest.id);
        } else {
          setActiveTest(null); // Should not happen, but as a fallback
        }
      } else {
        setActiveTest(null); // Last test, go home
      }
      return;
    }
  };
  
  if (activeTest) {
    const test = tests.find(t => t.id === activeTest);
    if (!test) return null;
    const TestComponent = test.component;
    return <TestComponent setPage={handleNavigation} />;
  }
  
  const isChiSeiComplete = userData.completedTests?.chiSei;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Esercizi</h2>
      {!isChiSeiComplete ? (
        <InfoBox><p>Benvenuto! Dopo aver letto le sezioni informative, compila "I tuoi dati" per sbloccare tutti gli altri test.</p></InfoBox>
      ) : (
        <p className="text-gray-600 mb-6">Scegli un esercizio da eseguire. Puoi seguirli in ordine o sceglierli liberamente.</p>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {tests.map(test => {
          const isCompleted = userData.completedTests?.[test.id];
          const isLocked = !test.isInfo && test.id !== 'chiSei' && !isChiSeiComplete;
          
          return (
            <button
              key={test.id}
              onClick={() => setActiveTest(test.id)}
              disabled={isLocked}
              className={`p-4 rounded-lg text-left transition-all duration-300 flex items-center space-x-4 border ${
                isLocked
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                  : isCompleted 
                  ? 'bg-green-50 border-green-300'
                  : 'bg-white hover:bg-blue-50 hover:border-blue-300 border-gray-200'
              } shadow-sm`}
            >
              <span className="text-4xl p-3 bg-slate-100 rounded-lg">{test.icon}</span>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800">{test.title}</h3>
                <p className="text-sm text-gray-600">{test.description}</p>
              </div>
              {isCompleted && <span className="text-green-600 text-2xl font-semibold">✓</span>}
              {isLocked && <span className="text-gray-400 text-2xl">🔒</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;