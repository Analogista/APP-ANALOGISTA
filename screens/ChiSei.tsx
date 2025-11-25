
import React from 'react';
import { useUser } from '../contexts/UserContext';

interface ScreenProps {
  setPage: (page: number) => void;
}

const ChiSei: React.FC<ScreenProps> = ({ setPage }) => {
  const { userData, setUserData } = useUser();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userData.nome && userData.eta && userData.genere) {
      setUserData(prev => ({
        ...prev,
        completedTests: { ...prev.completedTests, chiSei: true }
      }));
      setPage(0); // Callback to return to dashboard
    } else {
      alert("Per favore, compila tutti i campi.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">5) I tuoi dati</h2>
          <h3 className="text-lg font-semibold text-gray-600">Nome, età, sesso, problema</h3>
        </div>
        <button onClick={() => setPage(0)} className="text-sm text-blue-600 hover:underline flex-shrink-0 ml-4 mt-1">&larr; Torna alla home</button>
      </div>
      <p className="text-gray-600 mb-2 italic">Queste info che ti chiedo mi serviranno per farti le domande con la voce guida e calcolare i risultati. Non verranno memorizzati in alcun database, verranno resettati quando uscirai dalla App.</p>
      <p className="text-gray-600 mb-6">Scrivi i dati richiesti per sbloccare gli altri test.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700">NOME</label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={userData.nome}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="eta" className="block text-sm font-medium text-gray-700">ETÀ</label>
          <input
            type="number"
            id="eta"
            name="eta"
            value={userData.eta}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="genere" className="block text-sm font-medium text-gray-700">Genere</label>
          <select
            id="genere"
            name="genere"
            value={userData.genere}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          >
            <option value="" disabled>Seleziona</option>
            <option value="MASCHIO">MASCHIO</option>
            <option value="FEMMINA">FEMMINA</option>
          </select>
        </div>
        <div>
          <label htmlFor="problema" className="block text-sm font-medium text-gray-700">PROBLEMA DA RISOLVERE</label>
          <textarea
            id="problema"
            name="problema"
            value={userData.problema}
            onChange={handleChange}
            rows={4}
            placeholder="esempio: migliorare nei rapporti, migliorare l'autorealizzazione ecc..."
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mt-6">
          <p className="text-sm text-blue-800 text-center">Nel problema da risolvere, pensa a cosa o chi ti impedisce di sentirti libero/a di perseguire i tuoi sogni in pace con te stesso/a.</p>
        </div>
        
        <div className="mt-8 text-right">
          <button
            type="submit"
            className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Salva e vai alla Home
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChiSei;