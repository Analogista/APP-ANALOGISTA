
import React from 'react';
import InfoBox from '../components/InfoBox';

interface ScreenProps {
  setPage: (page: number) => void;
}

const LaTecnica: React.FC<ScreenProps> = ({ setPage }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">3) La Tecnica</h2>
          <h3 className="text-lg font-semibold text-gray-600">Come funziona questa tecnica.</h3>
        </div>
        <button onClick={() => setPage(0)} className="text-sm text-blue-600 hover:underline flex-shrink-0 ml-4 mt-1">&larr; Torna alla home</button>
      </div>

      <div className="space-y-4 text-gray-700">
        <p>Il nostro corpo è la "scatola nera" della nostra vita. Registra ogni emozione e ogni evento, soprattutto quelli che la mente conscia ha dimenticato o rimosso. Attraverso il dialogo analogico, interroghiamo il corpo per ottenere risposte dirette e sincere dal nostro inconscio.</p>
        <p>Useremo una telecamera per rilevare le tue oscillazioni corporee involontarie. Un movimento in avanti indica un "SÌ" emotivo, mentre un movimento all'indietro indica un "NO".</p>
      </div>

      <div className="my-6">
        <h4 className="text-lg font-semibold text-gray-700 mb-2 text-center">Video Esempio</h4>
        <div className="relative w-full overflow-hidden rounded-lg shadow-lg" style={{ paddingTop: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src="https://www.youtube-nocookie.com/embed/KYCnANJJxZQ"
            title="Esempio risposta inconscio"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
        <p className="text-sm text-gray-600 mt-3 text-center font-medium">Guarda questo video per vedere un esempio di come l'inconscio risponde alle mie domande.</p>
      </div>
      
      <InfoBox>
        <h3 className="font-bold mb-2">Perché funziona?</h3>
        <p>L'inconscio non mente. Quando facciamo una domanda che tocca un punto emotivamente carico, il corpo reagisce istintivamente. Questa reazione è più veloce e più onesta del pensiero razionale.</p>
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

// Fix: Add default export for the component
export default LaTecnica;