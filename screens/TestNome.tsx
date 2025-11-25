
import React, { useState, useRef, useMemo } from 'react';
import { useUser } from '../contexts/UserContext';
import CameraView from '../components/CameraView';
import { AdvancedVoiceService } from '../services/AdvancedVoiceService';
import InfoBox from '../components/InfoBox';

interface ScreenProps {
  setPage: (page: number) => void;
}

const TestNome: React.FC<ScreenProps> = ({ setPage }) => {
  const { userData, setUserData } = useUser();
  const [status, setStatus] = useState<'IDLE' | 'TESTING_VERO' | 'TESTING_FALSO' | 'DONE' | 'SUCCESS'>('IDLE');
  const [message, setMessage] = useState('Premi "Inizia Test" per avviare la verifica del nome.');
  const [result, setResult] = useState('');
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceService = useMemo(() => new AdvancedVoiceService(), []);

  const handleCameraReady = () => {
    if (videoRef.current) {
        voiceService.initializeDetector(videoRef.current);
        setIsCameraReady(true);
    }
  };

  const startTest = async () => {
    setStatus('TESTING_VERO');
    setResult('');

    try {
      setMessage('Test del tuo nome vero in corso...');
      const veroResponse = await voiceService.askQuestion(
        `Bene, sei in posizione? Fai un bel respiro. Caro inconscio è vero, si o no, che il tuo nome è ${userData.nome}? Se ti chiami ${userData.nome} spingerai il corpo in avanti altrimenti indietro. Attendo risposta.`,
        userData.nome
      );

      const newTestNomeData = { ...userData.testNome, nomeVero: veroResponse };
      setUserData(prev => ({...prev, testNome: newTestNomeData}));
      setResult(`Risposta al nome vero: ${veroResponse}.`);
      
      await new Promise(res => setTimeout(res, 2000));

      setStatus('TESTING_FALSO');
      setMessage('Ora proviamo con un nome falso...');
      const fakeName = "Alessandro Bianchi";
      const falsoResponse = await voiceService.askQuestion(
        `Adesso proviamo con un nome falso. Caro inconscio, è vero si o no che il tuo nome è ${fakeName}? Attendo risposta.`,
        fakeName
      );

      const finalTestNomeData = { ...newTestNomeData, nomeFalso: falsoResponse };
      setUserData(prev => ({
        ...prev, 
        testNome: finalTestNomeData,
        completedTests: { ...prev.completedTests, nome: true }
      }));

      setResult(prev => `${prev} Risposta al nome falso: ${falsoResponse}.`);
      

      if (veroResponse === 'SI') {
          setMessage('Test completato con successo! Proseguiamo.');
          setStatus('SUCCESS');
      } else {
          setMessage('Il tuo inconscio non ha confermato il tuo nome. Ti consigliamo di ripetere il test, ma puoi proseguire se vuoi.');
          setStatus('DONE');
      }
    } catch (error) {
        console.error("Speech synthesis error during name test:", error);
        setMessage("Errore audio. Per favore, riprova il test.");
        setStatus('IDLE');
    }
  };


  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">7) Test Nome</h2>
          <h3 className="text-lg font-semibold text-gray-600">Il tuo inconscio ti riconosce?</h3>
        </div>
        <button onClick={() => setPage(0)} className="text-sm text-blue-600 hover:underline flex-shrink-0 ml-4 mt-1">&larr; Torna alla home</button>
      </div>
      
      <InfoBox>
        <p>Posizionati di profilo tra le due linee rosse. La voce guida ti chiederà di confermare il tuo nome e un nome falso. L'app rileverà la risposta del tuo inconscio.</p>
      </InfoBox>

      <div className="my-6">
        <CameraView videoRef={videoRef} onReady={handleCameraReady} />
      </div>

      <div className="my-6 flex justify-center">
        {status === 'IDLE' && (
          <button
            onClick={startTest}
            disabled={!isCameraReady}
            className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400"
          >
           Inizia Test
          </button>
        )}
        {(status === 'TESTING_VERO' || status === 'TESTING_FALSO') && (
           <div className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-blue-600">Test in corso...</span>
           </div>
        )}
      </div>

       <div className="text-center p-4 bg-gray-50 rounded-lg min-h-[100px] flex flex-col justify-center">
        <p className={`font-semibold text-lg ${status === 'SUCCESS' ? 'text-green-600' : (status === 'DONE' ? 'text-orange-600' : 'text-blue-800')}`}>{message}</p>
        {result && <p className="text-gray-600 mt-2 text-sm">{result}</p>}
      </div>

      {(status === 'SUCCESS' || status === 'DONE') && (
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button 
                onClick={startTest} 
                className="flex-1 bg-gray-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition duration-300"
            >
                Riprova Test
            </button>
            <button 
                onClick={() => setPage(1)} 
                className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
            >
                Prosegui →
            </button>
        </div>
      )}

    </div>
  );
};

export default TestNome;