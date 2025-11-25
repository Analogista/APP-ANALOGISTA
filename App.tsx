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
        <div className="max-w-4xl mx-auto font-sans pb-20">
          <Header />
          <main className="p-2 sm:p-4">
            {renderContent()}
          </main>
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </HeaderProvider>
    </UserProvider>
  );
};

export default App;