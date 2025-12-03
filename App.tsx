import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import { Pets } from './pages/Pets';
import { ClinicMap } from './pages/Map';
import { Assistant } from './pages/Assistant';
import { Tools } from './pages/Tools';
import { Premium } from './pages/Premium';
import { AppTab } from './types';
import { getCurrentUser } from './services/db';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);

  useEffect(() => {
    // Check session
    const user = getCurrentUser();
    if (user) setIsLoggedIn(true);
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setActiveTab(AppTab.HOME);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    >
      {activeTab === AppTab.HOME && <Pets />}
      {activeTab === AppTab.MAP && <ClinicMap />}
      {activeTab === AppTab.ASSISTANT && <Assistant />}
      {activeTab === AppTab.TOOLS && <Tools />}
      {activeTab === AppTab.PREMIUM && <Premium />}
    </Layout>
  );
};

export default App;
