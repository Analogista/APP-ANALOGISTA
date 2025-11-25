import React from 'react';
import InfoBox from '../components/InfoBox';

interface ScreenProps {
  setPage: (page: number) => void;
}

const ChiSono: React.FC<ScreenProps> = ({ setPage }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">1) Chi sono</h2>
          <h3 className="text-lg font-semibold text-gray-600">Max Pisani Analogista</h3>
        </div>
        <button onClick={() => setPage(0)} className="text-sm text-blue-600 hover:underline flex-shrink-0 ml-4 mt-1">&larr; Torna alla home</button>
      </div>

      <div className="space-y-4 text-gray-700">
        <p>Sono Massimo Pisani, un Analogista dal 2007, professionista nel ramo olistico, autore di manuali si auto miglioramento e ricercatore appassionato delle Discipline Analogiche ideate da Stefano Benemeglio, il mio Maestro, alla cui memoria dedico questa App.</p>
        <p>La mia missione è guidare le persone in un viaggio di scoperta interiore, aiutandole a dialogare con il proprio inconscio, o istanza emotiva, per svelare e superare i blocchi emotivi che limitano il benessere e la felicità.</p>
      </div>
      
      <InfoBox className="mt-6">
        <h3 className="font-bold mb-2">La mia filosofia</h3>
        <p>Credo fermamente che ogni individuo possieda le risorse interiori per risolvere i propri disagi. Il mio ruolo è quello di essere un "traduttore" del linguaggio emotivo, fornendo gli strumenti per accedere a queste risorse e promuovere un cambiamento profondo e duraturo.</p>
      </InfoBox>

      <div className="mt-8 text-right">
        <button
          onClick={() => setPage(1)}
          className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-300"
        >
          Prosegui
        </button>
      </div>
    </div>
  );
};
export default ChiSono;