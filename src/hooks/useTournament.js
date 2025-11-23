import { useState, useEffect, useCallback } from 'react';
import { BackendService } from '../services/BackendService';

export const useTournament = (tournamentId, isRemoteMode = false) => {
  const [data, setData] = useState({ tournament: null, matches: [], isRemote: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!tournamentId) return;
    try {
      const result = await BackendService.getTournamentData(tournamentId, isRemoteMode);
      setData(result);
    } catch (err) { 
      console.error(err);
      setError(err); 
    } finally { 
      setLoading(false); 
    }
  }, [tournamentId, isRemoteMode]);

  useEffect(() => {
    setLoading(true);
    fetchData();
    // Subscribe based on whether we found it remotely or locally
    return BackendService.subscribe(tournamentId, fetchData, isRemoteMode);
  }, [tournamentId, fetchData, isRemoteMode]);

  return { ...data, loading, error };
};