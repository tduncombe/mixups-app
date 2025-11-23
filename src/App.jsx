import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { CreateView } from './components/CreateView';
import { DashboardView } from './components/DashboardView';

const App = () => {
  const [route, setRoute] = useState(() => {
    // 1. Check URL for share link
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('t');
    if (sharedId) {
      return { view: 'DASHBOARD', id: sharedId, isRemote: true };
    }

    // 2. Fallback to local storage route
    const saved = localStorage.getItem('mixups_route');
    return saved ? JSON.parse(saved) : { view: 'CREATE', id: null, isRemote: false };
  });

  useEffect(() => {
    // Only save route to local storage if it's NOT a remote one
    // (prevents getting stuck in remote mode if you open the app later)
    if (!route.isRemote) {
      localStorage.setItem('mixups_route', JSON.stringify(route));
    }
  }, [route]);

  const navigateToTournament = (id) => setRoute({ view: 'DASHBOARD', id, isRemote: false });
  const navigateHome = () => {
    // Clear URL params when going home
    window.history.pushState({}, '', '/');
    setRoute({ view: 'CREATE', id: null, isRemote: false });
  };

  return (
    <ThemeProvider>
      {route.view === 'CREATE' && <CreateView onCreate={navigateToTournament} />}
      {route.view === 'DASHBOARD' && (
        <DashboardView
          tournamentId={route.id}
          isRemoteMode={route.isRemote}
          onBack={navigateHome}
        />
      )}
    </ThemeProvider>
  );
};

export default App;
