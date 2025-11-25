
import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import TimeLineGraph from '../components/TimeLineGraph';

interface ScreenProps {
  setPage: () => void;
}

// ResultCard component for styling
const ResultCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4 border border-gray-200 print:border print:shadow-none print:mb-2">
        <h4 className="text-lg font-bold text-gray-800 border-b pb-2 mb-3 print:text-base print:mb-1">{title}</h4>
        <div className="text-gray-700 space-y-1 text-sm print:text-xs">{children}</div>
    </div>
);

const Risultati: React.FC<ScreenProps> = ({ setPage }) => {
  const { userData } = useUser();
  const [copyStatus, setCopyStatus] = useState('Copia Risultati');

  // Modal state
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState('39');
  
  const createResultsText = () => {
    return `
Riepilogo - Analogista Virtuale
===============================

👤 I Tuoi Dati
- Nome: ${userData.nome}
- Età: ${userData.eta}
- Genere: ${userData.genere}
- Problema: ${userData.problema || 'Non specificato'}

📝 Risultati dei Test
- Induttore: ${userData.induttoreResult || 'Non completato'}
- Punto Distonico: ${userData.puntoDistonicoFinale || 'Non identificato'}
- Sigillo: ${userData.sigilloFinale || 'Non identificato'}
- Time Line Diagnosi: ${userData.timeLine.diagnosi || 'N/D'}
- Time Line PU/PT: ${userData.timeLine.PU?.toFixed(1)} / ${userData.timeLine.PT?.toFixed(1)}
- Reazione al torto: ${userData.giustificatoTorto === 'SI' ? 'Giustificato' : (userData.giustificatoTorto === 'NO' ? 'Non Giustificato' : 'Non determinata')}
    `.trim();
  };

  const handleCopy = () => {
    const textToCopy = createResultsText();
    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopyStatus('Copiato ✓');
        setTimeout(() => setCopyStatus('Copia Risultati'), 2000);
    }).catch(err => {
        alert('Errore durante la copia dei risultati.');
        console.error('Copy failed', err);
    });
  };

  const handleDownload = () => {
    const textToSave = createResultsText();
    const blob = new Blob([textToSave], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risultati-analogista-${userData.nome || 'utente'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
      window.print();
  };

  const handleReset = () => {
      if (window.confirm("Sei sicuro di voler cancellare tutti i dati? Questa azione non può essere annullata e dovrai ricominciare da zero.")) {
          localStorage.removeItem('userData');
          window.location.reload();
      }
  };

  const handleSendToSelf = () => {
     if (!recipientPhone) {
        alert("Inserisci un numero di telefono valido.");
        return;
    }
    
    // Cleanup phone number: only digits
    const cleanPhone = recipientPhone.replace(/[^\d]/g, '');
    
    if (cleanPhone.length < 5) {
         alert("Il numero sembra troppo corto. Assicurati di includere il prefisso internazionale.");
         return;
    }

    const textToCopy = createResultsText();
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textToCopy)}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
        window.open(whatsappUrl, '_blank');
        setIsPhoneModalOpen(false);
    }).catch(() => {
        window.open(whatsappUrl, '_blank');
        setIsPhoneModalOpen(false);
    });
  };


  return (
    <div id="printable-results" className="bg-gray-50 rounded-lg shadow-lg p-4 sm:p-6 print:shadow-none print:p-0 print:bg-white">
      <div className="print:hidden">
        <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">Riepilogo dei Risultati</h2>
        <p className="text-center text-gray-600 mb-6">Ecco un sommario dei dati raccolti durante i test. Questi sono spunti per la tua crescita personale.</p>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-8">
          <h1 className="text-2xl font-bold">Report Analogista Virtuale</h1>
          <p className="text-sm text-gray-500">Max Pisani - Discipline Analogiche</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-2">
        <ResultCard title="👤 I Tuoi Dati">
            <p><strong>Nome:</strong> {userData.nome}</p>
            <p><strong>Età:</strong> {userData.eta}</p>
            <p><strong>Genere:</strong> {userData.genere}</p>
            <p><strong>Problema:</strong> {userData.problema || 'Non specificato'}</p>
        </ResultCard>

        <ResultCard title="👋 Test Induttore">
            <p><strong>Risultato:</strong> {userData.induttoreResult || 'Non completato'}</p>
            <p><strong>Mano Destra:</strong> {userData.testInduttore.manoDestra || '-'}</p>
            <p><strong>Mano Sinistra:</strong> {userData.testInduttore.manoSinistra || '-'}</p>
        </ResultCard>

        <ResultCard title="🎯 Punto Distonico">
            <p><strong>Area di disagio principale:</strong></p>
            <p className="font-semibold text-blue-700">{userData.puntoDistonicoFinale || 'Non identificata'}</p>
        </ResultCard>

        <ResultCard title="🔐 Sigillo-Vincolo">
            <p><strong>Blocco emotivo principale:</strong></p>
            <p className="font-semibold text-blue-700">{userData.sigilloFinale || 'Non identificato'}</p>
        </ResultCard>

        <div className="md:col-span-2 print:col-span-2">
            <ResultCard title="⏳ Time Line">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <p><strong>Diagnosi:</strong> <span className="font-bold text-purple-600">{userData.timeLine.diagnosi || 'N/D'}</span></p>
                        <p><strong>Età Evento Causa:</strong> {userData.timeLine.etaEventoCausa ? `${userData.timeLine.etaEventoCausa} anni` : 'Non calcolata'}</p>
                    </div>
                    {userData.timeLine.PU && (
                        <div className="mt-2 md:mt-0 text-xs grid grid-cols-2 gap-x-4 gap-y-1 bg-gray-50 p-2 rounded">
                            <span>PU (Utopico): {userData.timeLine.PU.toFixed(1)}</span>
                            <span>PT (Topico): {userData.timeLine.PT?.toFixed(1)}</span>
                            <span>AF (Antefatto): {userData.timeLine.etaAntefatto}</span>
                            <span>F (Fatto): {userData.timeLine.etaFatto}</span>
                            <span className="col-span-2 font-semibold">CDT (Tensione): {userData.timeLine.CDT?.toFixed(1)}</span>
                        </div>
                    )}
                </div>
                {/* Visual Graph */}
                {userData.timeLine.PU && (
                     <TimeLineGraph 
                        age={parseInt(userData.eta)} 
                        PU={userData.timeLine.PU} 
                        PT={userData.timeLine.PT} 
                        eventAge={parseInt(userData.timeLine.etaEventoCausa || '0')}
                        diagnosis={userData.timeLine.diagnosi}
                    />
                )}
            </ResultCard>
        </div>

        <ResultCard title="🔍 Testimone Chiave">
             <p><strong>Soggetto causa dell'evento:</strong></p>
             <p className="font-semibold text-blue-700">{userData.testimoneChiave || 'Non identificato'}</p>
        </ResultCard>
        
        <div className="md:col-span-2 print:col-span-2">
            <ResultCard title="📅 Giorno dell'Evento e Reazione">
                 <p><strong>Data esatta individuata:</strong></p>
                 <p className="font-semibold text-blue-700">{userData.giornoEvento || 'Non identificato'}</p>
                 <p className="mt-2"><strong>Reazione al torto subito:</strong></p>
                 <p className="font-semibold text-blue-700">{
                    userData.giustificatoTorto === 'SI' ? 'Hai GIUSTIFICATO il torto (non hai reagito)' :
                    userData.giustificatoTorto === 'NO' ? 'NON hai giustificato il torto (hai reagito)' :
                    'Non determinata'
                 }</p>
            </ResultCard>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center no-print">
          <button onClick={handleCopy} className="bg-gray-700 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-800 transition duration-300 flex items-center gap-2 w-full sm:w-auto justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H4z" /></svg>
            {copyStatus}
          </button>
          <button onClick={handleDownload} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center gap-2 w-full sm:w-auto justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            Scarica TXT
          </button>
          <button onClick={handlePrint} className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 transition duration-300 flex items-center gap-2 w-full sm:w-auto justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
            Stampa Report PDF
          </button>
      </div>
      
       <div className="mt-6 text-center no-print">
         <button onClick={() => setIsPhoneModalOpen(true)} className="bg-teal-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-600 transition duration-300 flex items-center gap-2 mx-auto shadow-md w-full sm:w-auto justify-center">
           <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.586-1.456l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.388 1.88 6.161l-1.36 4.945 5.064-1.327z"/></svg>
            Invia a te stesso (WhatsApp)
        </button>
      </div>

      {/* Phone Number Modal */}
      {isPhoneModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Invia Risultati a Te Stesso</h3>
                <p className="text-gray-600 text-sm mb-4">Inserisci il tuo numero di telefono completo di prefisso internazionale (es. 39 per l'Italia) per inviare il testo dei risultati al tuo contatto WhatsApp.</p>
                
                <label className="block text-sm font-medium text-gray-700 mb-1">Numero di Telefono</label>
                <input 
                    type="tel" 
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="es. 393331234567"
                    className="w-full p-3 border border-gray-300 rounded mb-4 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                
                <div className="flex justify-end gap-3">
                    <button 
                        onClick={() => setIsPhoneModalOpen(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded transition"
                    >
                        Annulla
                    </button>
                    <button 
                        onClick={handleSendToSelf}
                        className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 font-bold shadow transition"
                    >
                        Invia su WhatsApp
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="mt-8 text-center no-print">
        <p className="text-gray-700 mb-4">Per un'analisi approfondita e un percorso personalizzato, contatta un professionista.</p>
        <button onClick={setPage} className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition duration-300 text-lg shadow-md">
            Contatta Max Pisani &rarr;
        </button>
      </div>

      {/* Reset Data Button */}
      <div className="mt-12 pt-6 border-t border-gray-200 text-center no-print">
          <button 
            onClick={handleReset}
            className="text-xs text-red-500 hover:text-red-700 underline"
          >
              🗑️ Cancella tutti i dati e ricomincia
          </button>
      </div>

    </div>
  );
};

export default Risultati;
