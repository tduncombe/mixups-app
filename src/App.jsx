import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { CreateView } from './components/CreateView';
import { DashboardView } from './components/DashboardView';

const App = () => {
  const [route, setRoute] = useState(() => {
    const saved = localStorage.getItem('mixups_route');
    return saved ? JSON.parse(saved) : { view: 'CREATE', id: null };
  });
  useEffect(() => localStorage.setItem('mixups_route', JSON.stringify(route)), [route]);
  const navigateToTournament = (id) => setRoute({ view: 'DASHBOARD', id });
  const navigateHome = () => setRoute({ view: 'CREATE', id: null });

  return (
    <ThemeProvider>
      {route.view === 'CREATE' && <CreateView onCreate={navigateToTournament} />}
      {route.view === 'DASHBOARD' && <DashboardView tournamentId={route.id} onBack={navigateHome} />}
    </ThemeProvider>
  );
};

export default App;
