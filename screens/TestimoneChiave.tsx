import React, { useState, useRef, useMemo } from 'react';
import { useUser } from '../contexts/UserContext';
import CameraView from '../components/CameraView';
import { AdvancedVoiceService } from '../services/AdvancedVoiceService';
import InfoBox from '../components/InfoBox';

interface ScreenProps {
  setPage: (page: number) => void;
}

const TestimoneChiave: React.FC<ScreenProps> = ({ setPage }) => {
    const { userData, setUserData } = useUser();
    const [status, setStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [message, setMessage] = useState('Pronto a scoprire il Testimone Chiave?');
    const [isCameraReady, setIsCameraReady] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const voiceService = useMemo(() => new AdvancedVoiceService(), []);

    const { sigilloFinale, timeLine } = userData;

    const handleCameraReady = () => {
        if (videoRef.current) {
            voiceService.initializeDetector(videoRef.current);
            setIsCameraReady(true);
        }
    };
    
    const startTest = async () => {
        if (!sigilloFinale || !timeLine.etaEventoCausa) {
            setMessage("Completa prima i test 9 (Sigilli) e 10 (Time Line).");
            setStatus('ERROR');
            return;
        }
        setStatus('TESTING');
        
        const testimoniMaschi = ["Tuo padre", "Tuo nonno", "Tuo zio", "Tuo fratello", "Tuo cugino", "Un insegnante", "Un amico"];
        const testimoniFemmine = ["Tua madre", "Tua nonna", "Tua zia", "Tua sorella", "Tua cugina", "Un'insegnante", "Un'amica"];

        try {
            const introText = `Adesso andremo a ricercare quel soggetto, maschio o femmina, che determinò il sigillo "${sigilloFinale}" quando avevi ${timeLine.etaEventoCausa} anni. Mettiti in posizione, cominciamo.`;
            setMessage("Introduzione in corso...");
            await voiceService.speak(introText);
            await new Promise(res => setTimeout(res, 1000));

            // Determine gender first
            setMessage("L'evento fu causato da un uomo? (Sì/No)");
            let response = await voiceService.askQuestion("Era un uomo? Si o No, attendo risposta.");

            let testimoniDaTestare: string[] = [];
            if (response === 'SI') {
                testimoniDaTestare = testimoniMaschi;
            } else if (response === 'NO') {
                setMessage("L'evento fu causato da una donna? (Sì/No)");
                response = await voiceService.askQuestion("Era una donna? Si o No, attendo risposta.");
                if (response === 'SI') {
                    testimoniDaTestare = testimoniFemmine;
                } else {
                     setMessage("Non è stato possibile determinare il genere del testimone. Test concluso.");
                     setUserData(prev => ({ ...prev, testimoneChiave: "Genere non determinato", completedTests: { ...prev.completedTests, testimone: true } }));
                     setStatus('SUCCESS');
                     return;
                }
            } else {
                setMessage("Risposta non rilevata. Il test si è concluso.");
                setUserData(prev => ({ ...prev, testimoneChiave: "Risposta non rilevata", completedTests: { ...prev.completedTests, testimone: true } }));
                setStatus('SUCCESS');
                return;
            }
            
            // Iterate through the list
            for (const testimone of testimoniDaTestare) {
                setMessage(`Era ${testimone}? (Sì/No)`);
                const questionResponse = await voiceService.askQuestion(`Era ${testimone}? Si o No, attendo risposta.`);

                if (questionResponse === 'SI') {
                    setMessage(`Testimone Chiave identificato: ${testimone}.`);
                    setUserData(prev => ({
                        ...prev,
                        testimoneChiave: testimone,
                        completedTests: { ...prev.completedTests, testimone: true }
                    }));
                    setStatus('SUCCESS');
                    return;
                }
                 await new Promise(res => setTimeout(res, 1000));
            }
            
            setMessage("Nessun testimone identificato dalla lista. Il test è comunque completato.");
            setUserData(prev => ({
                ...prev,
                testimoneChiave: "Non identificato dalla lista fornita",
                completedTests: { ...prev.completedTests, testimone: true }
            }));
            setStatus('SUCCESS');

        } catch (error) {
            console.error("Speech synthesis error during witness test:", error);
            setMessage("Errore audio. Per favore, riprova il test.");
            setStatus('ERROR');
        }
    };
    
    const canStart = sigilloFinale && timeLine.etaEventoCausa;

    return (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">11) Il Testimone Chiave</h2>
                <h3 className="text-lg font-semibold text-gray-600">Da chi subisti il torto?</h3>
              </div>
              <button onClick={() => setPage(0)} className="text-sm text-blue-600 hover:underline flex-shrink-0 ml-4 mt-1">&larr; Torna alla home</button>
            </div>
            
            <InfoBox>
                <p>In questo test, scopriremo chi ha determinato il sigillo <strong>"{sigilloFinale || '(non definito)'}"</strong> all'età di <strong>{timeLine.etaEventoCausa || '(non definita)'}</strong>. Posizionati di profilo e segui le istruzioni.</p>
                {!canStart && <p className="text-red-600 font-bold mt-2">Completa prima i test Sigilli e Time Line!</p>}
            </InfoBox>

            <div className="my-6"><CameraView videoRef={videoRef} onReady={handleCameraReady} /></div>

            <div className="text-center p-4 bg-gray-50 rounded-lg min-h-[100px] flex flex-col justify-center">
                <p className={`font-semibold text-lg ${status === 'SUCCESS' ? 'text-green-600' : 'text-blue-800'}`}>{message}</p>
                 {status === 'TESTING' && (
                    <div className="flex items-center space-x-2 mt-2">
                        <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span className="text-blue-600">Indagine in corso...</span>
                   </div>
                )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                 {status !== 'SUCCESS' ? (
                    <button 
                        onClick={startTest} 
                        disabled={!isCameraReady || !canStart || status === 'TESTING'}
                        className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {status === 'IDLE' || status === 'ERROR' ? 'Inizia Test' : 'Test in corso...'}
                    </button>
                 ) : (
                     <>
                        <button 
                            onClick={startTest} 
                            className="flex-1 bg-gray-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition duration-300"
                        >
                            Riprova Test
                        </button>
                        <button 
                            onClick={() => setPage(1)} 
                            className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition duration-300"
                        >
                           Prosegui →
                        </button>
                     </>
                 )}
            </div>
        </div>
    );
};

export default TestimoneChiave;