
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
  { id: 'induttore', title: '6) Test Induttore', description: 'Mano dx e sx: Istituzionale o Trasgressivo?', component: TestInduttore, icon: '👋' },
  { id: 'nome', title: '7) Test Nome', description: 'Il tuo inconscio ti riconosce?', component: TestNome, icon: '🆔' },
  { id: 'puntiDistonici', title: '8) Punti Distonici', description: 'Identifica le aree di disagio.', component: TestPuntiDistonici, icon: '🎯' },
  { id: 'sigilli', title: '9) Sigilli-Vincoli', description: 'Scopri i blocchi emotivi presenti.', component: TestSigilliVincoli, icon: '🔐' },
  { id: 'timeLine', title: '10) Time Line', description: 'Vai indietro nel tempo (PU/PT).', component: CalcolaTimeLine, icon: '⏳' },
  { id: 'testimone', title: '11) Testimone Chiave', description: 'Da chi subisti il torto?', component: TestimoneChiave, icon: '🔍' },
  { id: 'qualeGiorno', title: '12) Quale giorno?', description: 'Individua il giorno esatto.', component: QualeGiorno, icon: '📅' },
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
  
  // Calcolo Progresso
  const totalTests = tests.length;
  const completedCount = tests.reduce((acc, test) => {
      // Per i test informativi, li consideriamo completati se l'utente ha fatto "Chi Sei" o se l'utente ha cliccato su di essi (in una app reale salveremmo lo stato 'letto').
      // Per semplicità qui: se ha fatto 'chiSei', i primi 4 (info) sono considerati "visti".
      if (test.isInfo) return userData.completedTests?.chiSei ? acc + 1 : acc;
      return userData.completedTests?.[test.id] ? acc + 1 : acc;
  }, 0);
  const progressPercent = Math.round((completedCount / totalTests) * 100);


  if (activeTest) {
    const test = tests.find(t => t.id === activeTest);
    if (!test) return null;
    const TestComponent = test.component;
    return <TestComponent setPage={handleNavigation} />;
  }
  
  const isChiSeiComplete = userData.completedTests?.chiSei;

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-4 sm:p-8 border border-white">
      
      {/* Intestazione Dashboard con Progresso */}
      <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
          <div className="relative z-10 flex justify-between items-center">
             <div>
                <h2 className="text-2xl font-serif font-bold mb-1">Il Tuo Percorso</h2>
                <p className="text-blue-100 text-sm">Ogni passo ti avvicina al tuo inconscio.</p>
             </div>
             <div className="text-right">
                <span className="text-4xl font-bold">{progressPercent}%</span>
             </div>
          </div>
          {/* Progress Bar Track */}
          <div className="mt-4 w-full bg-blue-900/30 rounded-full h-2">
             <div 
                className="bg-white h-2 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                style={{ width: `${progressPercent}%` }}
             ></div>
          </div>
      </div>

      {!isChiSeiComplete ? (
        <InfoBox variant="warning"><p className="font-medium">Benvenuto! Inizia leggendo le sezioni informative e compila "I tuoi dati" per sbloccare il percorso completo.</p></InfoBox>
      ) : (
        <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600 font-medium">Seleziona un esercizio:</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {tests.map(test => {
          const isCompleted = userData.completedTests?.[test.id];
          const isLocked = !test.isInfo && test.id !== 'chiSei' && !isChiSeiComplete;
          
          return (
            <button
              key={test.id}
              onClick={() => setActiveTest(test.id)}
              disabled={isLocked}
              className={`group relative p-4 rounded-xl text-left transition-all duration-300 flex items-center space-x-4 border overflow-hidden ${
                isLocked
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100'
                  : isCompleted 
                  ? 'bg-green-50/50 border-green-200 hover:shadow-md hover:border-green-300'
                  : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1'
              }`}
            >
              {/* Active Indicator Strip */}
              {!isLocked && !isCompleted && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>}

              <span className={`text-3xl p-3 rounded-xl transition-colors ${
                  isCompleted ? 'bg-green-100 text-green-700' : 
                  isLocked ? 'bg-gray-100 grayscale' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:scale-110 duration-300'
              }`}>
                  {test.icon}
              </span>
              
              <div className="flex-1 min-w-0">
                <h3 className={`font-serif font-bold text-lg truncate ${isLocked ? 'text-gray-400' : 'text-gray-800'}`}>
                    {test.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 truncate">{test.description}</p>
              </div>

              <div className="flex-shrink-0 ml-2">
                 {isCompleted && (
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                 )}
                 {isLocked && <span className="text-gray-300 text-xl">🔒</span>}
                 {!isLocked && !isCompleted && (
                     <span className="text-gray-300 group-hover:text-blue-500 transition-colors">→</span>
                 )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
