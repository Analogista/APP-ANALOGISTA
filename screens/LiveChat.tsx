import React, { useState, useEffect, useRef, useCallback } from 'react';
// Fix: Import types and classes from @google/genai
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { useHeader } from '../contexts/HeaderContext';
import { useApiKey } from '../contexts/ApiKeyContext';

// Helper functions from Gemini docs for audio encoding/decoding
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

const LiveChat: React.FC = () => {
    const { setHeader } = useHeader();
    const { apiKey } = useApiKey();

    useEffect(() => {
        setHeader('Live Chat AI', 'Parla con l\'intelligenza artificiale');
    }, [setHeader]);

    const [isSessionActive, setIsSessionActive] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Premi "Avvia Chat" per iniziare.');
    const [transcriptionHistory, setTranscriptionHistory] = useState<{ user: string; model: string }[]>([]);
    const currentInputTranscription = useRef('');
    const currentOutputTranscription = useRef('');
    // Fix: Use `any` for the session promise as `LiveSession` is not an exported type.
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    
    // Audio processing refs
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());


    const stopSession = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }

        setIsSessionActive(false);
        setStatusMessage('Premi "Avvia Chat" per iniziare.');
    }, []);

    const startSession = useCallback(async () => {
        if (!apiKey) {
            setStatusMessage("API Key non configurata. Impossibile avviare la chat.");
            return;
        }
        setStatusMessage('Inizializzazione...');
        setIsSessionActive(true);
        
        const systemInstruction = `Sei un assistente virtuale specializzato sull'applicazione "Analogista Virtuale di Max Pisani". Il tuo scopo è aiutare gli utenti a capire come usare l'app e i principi su cui si basa.

**Contesto dell'App:**
- **Nome:** Analogista Virtuale di Max Pisani
- **Creatore:** Max Pisani, un Analogista che segue le Discipline Analogiche.
- **Dedica:** L'app è dedicata alla memoria di Stefano Benemeglio, il fondatore delle Discipline Analogiche.
- **Scopo:** Aiutare gli utenti a dialogare con il loro inconscio per identificare e risolvere blocchi emotivi. Non è uno strumento medico.
- **Tecnologia Base:** L'app usa la webcam per rilevare le oscillazioni involontarie del corpo. Un movimento in avanti significa "SÌ", uno all'indietro significa "NO".

**Descrizione dei Test Principali:**
- **Test Induttore:** Serve a capire la "fase" dell'utente (Istituzionale o Trasgressiva) per identificare se il conflitto principale è con una figura dello stesso sesso (Istituzionale/Destro) o di sesso opposto (Trasgressivo/Sinistro). Si usa la mano, non il busto.
- **Test Punti Distonici:** Identifica l'area di vita che causa disagio (famiglia, autorealizzazione, sentimenti, sesso).
- **Test Sigilli-Vincoli:** Scopre il blocco emotivo specifico legato al punto distonico (es. Senso di colpa, Paura dell'abbandono, Disistima, Timore del giudizio).
- **Time Line, Testimone Chiave, Quale Giorno:** Sono test investigativi per trovare QUANDO, con CHI e in CHE GIORNO è avvenuto l'evento che ha causato il sigillo.
- **Reazione al Torto:** L'ultimo test scopre se l'utente ha "giustificato" (subito passivamente) o "non giustificato" (reagito con rabbia) il torto.

**Le Tue Regole:**
1.  Rispondi sempre in italiano.
2.  Sii cordiale, professionale e incoraggiante.
3.  Quando ti viene chiesto come funziona un test, spiega brevemente il suo scopo usando le informazioni qui sopra.
4.  **IMPORTANTE:** Non fornire mai consigli medici, psicologici o diagnosi. Se un utente chiede un parere sulla sua situazione personale, rispondi che l'app è uno strumento di auto-esplorazione e che per un'analisi approfondita è fondamentale contattare un professionista come Max Pisani o un medico.
5.  Mantieni le risposte concise e facili da capire.`;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            nextStartTimeRef.current = 0;

            const ai = new GoogleGenAI({ apiKey: apiKey });
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: systemInstruction,
                },
                callbacks: {
                    onopen: () => {
                        setStatusMessage('Connesso. Parla pure.');
                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;
                        const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscription.current += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscription.current += message.serverContent.outputTranscription.text;
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                            const source = outputAudioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContextRef.current.destination);
                            source.addEventListener('ended', () => {
                                sourcesRef.current.delete(source);
                            });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                        
                        if (message.serverContent?.turnComplete) {
                            const userInput = currentInputTranscription.current;
                            const modelOutput = currentOutputTranscription.current;
                            if (userInput || modelOutput) {
                                setTranscriptionHistory(prev => [...prev, { user: userInput, model: modelOutput }]);
                            }
                            currentInputTranscription.current = '';
                            currentOutputTranscription.current = '';
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        setStatusMessage(`Errore di connessione: ${e.message}`);
                        stopSession();
                    },
                    onclose: () => {
                        setStatusMessage('Connessione chiusa.');
                        setIsSessionActive(false);
                    },
                },
            });

        } catch (error) {
            console.error('Failed to start session:', error);
            setStatusMessage('Impossibile accedere al microfono. Controlla le autorizzazioni.');
            setIsSessionActive(false);
        }
    }, [apiKey, stopSession]);
    
    useEffect(() => {
      // Cleanup on unmount
      return () => {
          stopSession();
      };
    }, [stopSession]);

    return (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 flex flex-col h-[calc(100vh-150px)]">
            <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Gemini Live Chat</h2>
                <p className="text-gray-600">Parla con l'assistente AI in tempo reale.</p>
            </div>
            
            <div className="text-center p-3 bg-gray-100 rounded-lg mb-4">
                <p className="font-semibold">{statusMessage}</p>
            </div>

            <div className="flex-grow bg-gray-50 p-4 rounded-lg overflow-y-auto mb-4">
                {transcriptionHistory.map((turn, index) => (
                    <div key={index} className="mb-4">
                        <p className="font-bold text-blue-600">Tu:</p>
                        <p className="ml-2 mb-2 text-gray-700">{turn.user || "..."}</p>
                        <p className="font-bold text-green-600">Gemini:</p>
                        <p className="ml-2 text-gray-700">{turn.model || "..."}</p>
                    </div>
                ))}
            </div>

            <button
                onClick={isSessionActive ? stopSession : startSession}
                className={`w-full font-bold py-3 px-4 rounded-lg text-white transition duration-300 flex items-center justify-center ${
                    isSessionActive
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
                {isSessionActive ? 'Termina Chat' : 'Avvia Chat'}
            </button>
        </div>
    );
};

export default LiveChat;