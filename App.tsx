import React, { useState } from 'react';
import { UserProvider } from './contexts/UserContext';
import { HeaderProvider } from './contexts/HeaderContext';

import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Dashboard from './screens/Dashboard';
import Risultati from './screens/Risultati';
import Contatti from './screens/Contatti';

export type Tab = 'home' | 'risultati' | 'contatti';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard />;
      case 'risultati':
        return <Risultati setPage={() => setActiveTab('contatti')} />;
      case 'contatti':
        return <Contatti setPage={() => {}} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <UserProvider>
      <HeaderProvider>
        {/* Sfondo Gradiente "Spirituale/Tecnologico" */}
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans pb-24 text-gray-800">
          <div className="max-w-4xl mx-auto shadow-2xl min-h-screen bg-white/50 backdrop-blur-sm border-x border-white/50">
            <Header />
            <main className="p-3 sm:p-6 transition-all duration-300 ease-in-out">
              {renderContent()}
            </main>
            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </div>
      </HeaderProvider>
    </UserProvider>
  );
};

export default App;