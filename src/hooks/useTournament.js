import { useState, useEffect, useCallback } from 'react';
import { BackendService } from '../services/BackendService';

export const useTournament = (tournamentId) => {
  const [data, setData] = useState({ tournament: null, matches: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!tournamentId) return;
    try {
      const result = await BackendService.getTournamentData(tournamentId);
      setData(result);
    } catch (err) { setError(err); } finally { setLoading(false); }
  }, [tournamentId]);

  useEffect(() => {
    setLoading(true);
    fetchData();
    return BackendService.subscribe(tournamentId, fetchData);
  }, [tournamentId, fetchData]);

  return { ...data, loading, error };
};
