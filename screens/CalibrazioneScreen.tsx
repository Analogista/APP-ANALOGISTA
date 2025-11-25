
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useUser } from '../contexts/UserContext';
import { AdvancedVoiceService } from '../services/AdvancedVoiceService';
import CameraView from '../components/CameraView';
import InfoBox from '../components/InfoBox';

interface ScreenProps {
  setPage: (page: number) => void;
}

const CalibrazioneScreen: React.FC<ScreenProps> = ({ setPage }) => {
  const { userData, setUserData } = useUser();
  const [status, setStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS'>('IDLE');
  const [message, setMessage] = useState('Premi "Avvia Calibrazione" per iniziare.');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceService = useMemo(() => new AdvancedVoiceService(), []);

  useEffect(() => {
    if (userData.completedTests?.calibrazione) {
        setStatus('SUCCESS');
        setMessage("Calibrazione già completata! Puoi riprovare o proseguire.");
    }
  }, [userData.completedTests?.calibrazione]);

  useEffect(() => {
    // Clean up on unmount
    return () => {
      voiceService.stopSpeaking();
      voiceService.stopManualDetection();
    };
  }, [voiceService]);

  const handleCameraReady = () => {
    if (videoRef.current) {
      voiceService.initializeDetector(videoRef.current);
      setIsCameraReady(true);
    }
  };

  const startCalibration = async () => {
    setStatus('TESTING');
    setMessage("Calibrazione illimitata in corso. Oscilla per testare il feedback.");

    try {
      if (!hasPlayedIntro) {
          await voiceService.speak("Questa è la fase di calibrazione. Posizionati di profilo al centro dell'inquadratura. Quando sei pronto, prova a oscillare lentamente in avanti per dire di sì, e indietro per dire di no. L'app ti darà un feedback visivo e sonoro.");
          setHasPlayedIntro(true);
      }
      
      voiceService.startManualDetection();
      
      // Removed timeout. Calibration runs indefinitely until user navigates away or stops manually.
      
    } catch (error) {
      console.error("Error during calibration:", error);
      setMessage("Si è verificato un errore. Riprova la calibrazione.");
      setStatus('IDLE');
    }
  };

  const handleProsegui = () => {
      // Mark as done when user decides to leave
      setUserData(prev => ({
          ...prev,
          completedTests: { ...prev.completedTests, calibrazione: true }
      }));
      setPage(1); // Go to dashboard or next test logic
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
       <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">4) Calibrazione</h2>
          <h3 className="text-lg font-semibold text-gray-600">Prepara il sistema al test.</h3>
        </div>
        <button onClick={() => setPage(0)} className="text-sm text-blue-600 hover:underline flex-shrink-0 ml-4 mt-1">&larr; Torna alla home</button>
      </div>
      
      <InfoBox>
        <h4 className="font-bold text-gray-800 mb-2">Istruzioni ideali per l'utente:</h4>
        <p className="italic text-gray-700">
            "Posizionati di profilo, spalla sinistra verso la cam, a circa 1,5 metri dalla videocamera. Lo smartphone (videocamera) in linea (nè troppo bassa nè troppo alta). Assicurati che l'inquadratura tagli la testa e le gambe, mostrando bene solo il busto e le spalle. La tua spalla deve trovarsi al centro dello schermo. Rilassati. Col viso puoi osservare, solo nel test calibrazione, come si comporta la rilevazione. Negli altri test NO"
        </p>
        <div className="mt-4 pt-3 border-t border-blue-200">
            <p className="font-bold text-sm text-blue-800">
                DA FERMO, DI PROFILO, PREMI il pulsante "Avvia Calibrazione".
            </p>
        </div>
      </InfoBox>

      <div className="my-6">
        <CameraView videoRef={videoRef} onReady={handleCameraReady} />
      </div>

      <div className="my-6 flex justify-center">
        {status === 'IDLE' && (
          <button
            onClick={startCalibration}
            disabled={!isCameraReady}
            className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400"
          >
           Avvia Calibrazione
          </button>
        )}
        {status === 'TESTING' && (
           <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200 animate-pulse">
                <span className="text-green-700 font-bold">Rilevamento Attivo (Illimitato)</span>
           </div>
        )}
      </div>

      <div className="text-center p-4 bg-gray-50 rounded-lg min-h-[80px] flex flex-col justify-center">
        <p className={`font-semibold text-lg ${status === 'SUCCESS' ? 'text-green-600' : 'text-blue-800'}`}>{message}</p>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        {status === 'TESTING' || status === 'SUCCESS' ? (
             <>
                <button 
                    onClick={startCalibration} 
                    className="flex-1 bg-gray-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition duration-300"
                >
                    Riprova Calibrazione
                </button>
                <button 
                    onClick={handleProsegui} 
                    className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
                >
                    Prosegui →
                </button>
            </>
        ) : null}
      </div>

    </div>
  );
};

export default CalibrazioneScreen;
