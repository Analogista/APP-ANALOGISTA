import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { useHeader } from '../contexts/HeaderContext';
import { useApiKey } from '../contexts/ApiKeyContext';

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

const ChatBot: React.FC = () => {
    const { setHeader } = useHeader();
    const { apiKey } = useApiKey();

    useEffect(() => {
        setHeader('AI Chat Bot', 'Scrivi un messaggio per iniziare');
    }, [setHeader]);

    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatRef = useRef<Chat | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (!apiKey) {
            setError("API Key non configurata. Impossibile avviare il chatbot.");
            return;
        }
        const ai = new GoogleGenAI({ apiKey: apiKey });
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

        chatRef.current = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: systemInstruction
            }
        });
    }, [apiKey]);

    useEffect(() => {
        // Scroll to the bottom of the chat container when new messages are added
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading || !chatRef.current) return;
        
        const messageToSend = userInput;
        setUserInput('');
        setIsLoading(true);
        setError(null);
        
        setChatHistory(prev => [...prev, { role: 'user', text: messageToSend }]);

        try {
            const stream = await chatRef.current.sendMessageStream({ message: messageToSend });

            let modelResponse = '';
            setChatHistory(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setChatHistory(prev => {
                    const newHistory = [...prev];
                    if (newHistory.length > 0) {
                      newHistory[newHistory.length - 1].text = modelResponse;
                    }
                    return newHistory;
                });
            }

        } catch (err) {
            console.error("Error sending message:", err);
            setError("Si è verificato un errore. Riprova.");
            setChatHistory(prev => prev.slice(0, -1)); // Remove the model's placeholder on error
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 flex flex-col h-[calc(100vh-150px)]">
             <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Gemini Chat Bot</h2>
                <p className="text-gray-600">Fai una domanda o inizia una conversazione.</p>
            </div>
            
            <div ref={chatContainerRef} className="flex-grow bg-gray-50 p-4 rounded-lg overflow-y-auto mb-4 space-y-4">
                {chatHistory.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl whitespace-pre-wrap break-words ${
                            message.role === 'user' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-800'
                        }`}>
                            {message.text}
                        </div>
                    </div>
                ))}
                {isLoading && chatHistory[chatHistory.length -1]?.role === 'user' && (
                    <div className="flex justify-start">
                        <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-2xl">
                            <span className="animate-pulse">...</span>
                        </div>
                    </div>
                )}
            </div>

            {error && <p className="text-red-500 text-center mb-2">{error}</p>}
            
            <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={isLoading ? "In attesa di risposta..." : "Scrivi il tuo messaggio..."}
                    className="flex-grow px-4 py-2 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !userInput.trim()}
                    className="bg-blue-600 text-white font-bold p-3 rounded-full hover:bg-blue-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default ChatBot;