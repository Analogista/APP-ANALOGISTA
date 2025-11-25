
import React, { useState, useRef, useMemo } from 'react';
import { useUser } from '../contexts/UserContext';
import CameraView from '../components/CameraView';
import { AdvancedVoiceService } from '../services/AdvancedVoiceService';
import InfoBox from '../components/InfoBox';

interface ScreenProps {
  setPage: (page: number) => void;
}

type TestStatus = 'WAITING_INTRO' | 'INTRO_PLAYING' | 'READY_TO_START' | 'TESTING_DESTRA' | 'TESTING_SINISTRA' | 'DONE' | 'SUCCESS';

const TestInduttore: React.FC<ScreenProps> = ({ setPage }) => {
  const { userData, setUserData } = useUser();
  const [status, setStatus] = useState<TestStatus>('WAITING_INTRO');
  const [message, setMessage] = useState('Premi "Ascolta Istruzioni" per prepararti al test.');
  const [results, setResults] = useState({ destra: '', sinistra: '' });
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceService = useMemo(() => new AdvancedVoiceService(), []);

  const handleCameraReady = () => {
    if (videoRef.current) {
        voiceService.initializeDetector(videoRef.current);
        setIsCameraReady(true);
    }
  };

  const playInstructions = async () => {
    setStatus('INTRO_PLAYING');
    setMessage('Ascolta le istruzioni...');
    
    const introText = `${userData.nome} poniti in piedi di profilo, io dovrò vedere la spalla sinistra, è sufficiente che io veda solo il tuo busto, dalla vita in sù. Braccia lungo il corpo, ti chiederò di muovere, come nel video sopra, prima la mano destra e valuterò l'oscillazione naturale del tuo corpo, se in avanti o indietro. La stessa cosa ti chiederò per la mano sinistra. Quando sei pronto clicca il pulsante "avvia".`;
    
    try {
      await voiceService.speak(introText);
      setStatus('READY_TO_START');
      setMessage('Premi "Avvia" per iniziare il test.');
    } catch (error) {
      console.error("Speech error:", error);
      setMessage("Errore audio. Riprova.");
      setStatus('WAITING_INTRO');
    }
  };

  const startTest = async () => {
    setStatus('TESTING_DESTRA');
    setResults({ destra: '', sinistra: '' });
    
    try {
      setMessage('Test della mano DESTRA in corso...');
      // Instruction for Right Hand
      const destraPrompt = `Adesso ${userData.nome} sfrega il pollice della mano destra con le altre dita della mano per qualche secondo, io rileverò l'oscillazione.`;
      
      // askQuestion speaks the text, then waits (default 1.5s delay + 10s timeout) for movement
      const destraResponse = await voiceService.askQuestion(destraPrompt);
      
      const destraResultText = destraResponse === 'SI' ? 'Avanti' : destraResponse === 'NO' ? 'Indietro' : 'Non Rilevato';
      setResults(prev => ({ ...prev, destra: destraResultText }));
      
       if (destraResponse === 'NON_RILEVATO') {
          setMessage('Risposta non rilevata per la mano destra. Riprova il test.');
          // Reset to ready state so they can try again without listening to long intro
          setStatus('READY_TO_START'); 
          return;
      }
      
      // Short pause between tests
      await new Promise(res => setTimeout(res, 2000));

      setStatus('TESTING_SINISTRA');
      setMessage('Ora test della mano SINISTRA...');
      
      // Instruction for Left Hand
      const sinistraPrompt = "Bene, adesso fai la stessa cosa con la mano sinistra ed io rileverò l'oscillazione.";
      
      const sinistraResponse = await voiceService.askQuestion(sinistraPrompt);
      
      const sinistraResultText = sinistraResponse === 'SI' ? 'Avanti' : sinistraResponse === 'NO' ? 'Indietro' : 'Non Rilevato';
      setResults(prev => ({ ...prev, destra: destraResultText, sinistra: sinistraResultText }));

      if (sinistraResponse === 'NON_RILEVATO') {
          setMessage('Risposta non rilevata per la mano sinistra. Riprova il test.');
          setStatus('READY_TO_START');
          return;
      }

      let induttoreFinalResult: 'Destro' | 'Sinistro' | '' = '';
      if (destraResultText === 'Avanti' && sinistraResultText === 'Indietro') {
        induttoreFinalResult = 'Destro';
        setMessage('Induttore Destro rilevato! Corrisponde alla "Sindrome di Giulietta e Romeo" (Problema di Libertà/Decisione).');
      } else if (destraResultText === 'Indietro' && sinistraResultText === 'Avanti') {
        induttoreFinalResult = 'Sinistro';
        setMessage('Induttore Sinistro rilevato! Corrisponde alla "Sindrome di Dante e Beatrice" (Problema di Sogno/Conquista).');
      } else {
        setMessage('Combinazione di risposte non valida (es. entrambe Avanti o Indietro). Prova a ripetere il test per un risultato chiaro.');
        setStatus('DONE');
        setUserData(prev => ({
          ...prev,
          testInduttore: { manoDestra: destraResultText as 'Avanti' | 'Indietro', manoSinistra: sinistraResultText as 'Avanti' | 'Indietro' },
          induttoreResult: '',
        }));
        return;
      }
      
      setUserData(prev => ({
        ...prev,
        testInduttore: { manoDestra: destraResultText as 'Avanti' | 'Indietro', manoSinistra: sinistraResultText as 'Avanti' | 'Indietro' },
        induttoreResult: induttoreFinalResult,
        completedTests: { ...prev.completedTests, induttore: true }
      }));
      
      setStatus('SUCCESS');

    } catch (error) {
        console.error("Speech synthesis error during inductor test:", error);
        setMessage("Errore audio. Per favore, riprova il test.");
        setStatus('READY_TO_START');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">6) Test Induttore mano dx e sx</h2>
          <h3 className="text-lg font-semibold text-gray-600">Scopri se sei in fase "Trasgressiva" o "Istituzionale".</h3>
        </div>
        <button onClick={() => setPage(0)} className="text-sm text-blue-600 hover:underline flex-shrink-0 ml-4 mt-1">&larr; Torna alla home</button>
      </div>
      
      <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="font-bold text-gray-800 mb-2">Grillo e Lucignolo: Emblemi di Regole e Trasgressione</h4>
          <p className="text-gray-700 text-sm">
              Il Grillo e Lucignolo sono due personaggi mutuati dalla storia di Pinocchio e utilizzati nella metodologia analogica, da Max Pisani, come emblemi istituzionali e trasgressivi che rappresentano due diverse "vocine" dentro di noi che ci spingono a Trasgredire o rispettare le Regole. Essi rappresentano metaforicamente due facce della stessa medaglia: la costante lotta interiore dell'individuo tra il dovere e il piacere. Scopri chi dei 2 prevale in questa fase della tua vita.
          </p>
      </div>
      
      <InfoBox>
        <p>Questo test determina la tua fase attuale. Stai in piedi di profilo. Ascolta attentamente le istruzioni vocali prima di iniziare.</p>
      </InfoBox>
      
      <div className="my-6">
        <h4 className="text-lg font-semibold text-gray-700 mb-2 text-center">Video Esempio</h4>
        <div className="relative w-full overflow-hidden rounded-lg shadow-lg" style={{ paddingTop: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src="https://www.youtube-nocookie.com/embed/qeS_LeG--jA"
            title="Esempio movimento mano test induttore"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
      </div>
      
      <div className="my-6">
        <CameraView videoRef={videoRef} onReady={handleCameraReady} />
      </div>

      <div className="my-6 flex justify-center gap-4">
        {status === 'WAITING_INTRO' && (
          <button
            onClick={playInstructions}
            disabled={!isCameraReady}
            className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400"
          >
           Ascolta Istruzioni
          </button>
        )}
        
        {status === 'INTRO_PLAYING' && (
             <div className="flex items-center space-x-2 bg-blue-50 px-6 py-3 rounded-lg border border-blue-200">
                <svg className="animate-pulse h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <span className="text-blue-800 font-medium">Voce guida in corso...</span>
           </div>
        )}

        {status === 'READY_TO_START' && (
          <button
            onClick={startTest}
            className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition duration-300 animate-pulse"
          >
           Avvia
          </button>
        )}

        {(status === 'TESTING_DESTRA' || status === 'TESTING_SINISTRA') && (
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
        <div className="mt-2 text-sm text-gray-600">
            <p>Mano Destra: <span className="font-bold">{results.destra || '-'}</span></p>
            <p>Mano Sinistra: <span className="font-bold">{results.sinistra || '-'}</span></p>
        </div>
      </div>

      {(status === 'SUCCESS' || status === 'DONE') && (
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button 
                onClick={() => setStatus('READY_TO_START')} 
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

export default TestInduttore;
