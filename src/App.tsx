/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useGameStore } from './store/gameStore';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Standings from './components/Standings';
import Teams from './components/Teams';
import Schedule from './components/Schedule';

export default function App() {
  const { initialize } = useGameStore();
  const [hash, setHash] = useState(window.location.hash || '#dashboard');

  useEffect(() => {
    initialize();

    const handleHashChange = () => {
      setHash(window.location.hash || '#dashboard');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [initialize]);

  const renderContent = () => {
    switch (hash) {
      case '#dashboard':
        return <Dashboard />;
      case '#standings':
        return <Standings />;
      case '#teams':
        return <Teams />;
      case '#schedule':
        return <Schedule />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderContent()}
    </Layout>
  );
}
