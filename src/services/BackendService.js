import { generateUUID, wait } from '../utils/helpers';
import { Scheduler } from '../utils/scheduler';
import { supabase } from '../lib/supabase';

const DB_KEY = 'mixups_v1_db';

export const BackendService = {
  // --- Local Helpers ---
  getLocalDB: () => {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : { tournaments: [], matches: [] };
  },
  saveLocalDB: (db) => localStorage.setItem(DB_KEY, JSON.stringify(db)),

  // --- Creation (Always Local First) ---
  createTournament: async (players, config) => {
    await wait(600);
    const db = BackendService.getLocalDB();
    const tournamentId = generateUUID();
    const tournament = { id: tournamentId, createdAt: new Date().toISOString(), players, config };
    const matches = Scheduler.generateSchedule(players, config).map(m => ({ ...m, tournamentId }));

    db.tournaments.push(tournament);
    db.matches = [...db.matches, ...matches];
    BackendService.saveLocalDB(db);
    return tournamentId;
  },

  // --- Hybrid Fetching ---
  getTournamentData: async (tournamentId, forceRemote = false) => {
    // 1. Try to load from Supabase if forced or if we decide to prioritize it
    if (forceRemote && supabase) {
      const { data: tData, error: tError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      const { data: mData, error: mError } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', tournamentId);

      if (tData && mData && !tError && !mError) {
        // Normalize the data structure from snake_case (DB) to camelCase (JS)
        const tournament = {
          id: tData.id,
          createdAt: tData.created_at,
          players: tData.players,
          config: tData.config
        };

        const matches = mData
          .map(m => ({
            id: m.id,
            tournamentId: m.tournament_id,
            team1: m.team1,
            team2: m.team2,
            scores: m.scores || {},
            winner: m.winner,
            isComplete: m.is_complete || false,
            orderIndex: m.order_index
          }))
          .sort((a, b) => a.orderIndex - b.orderIndex);

        return {
          tournament,
          matches,
          isRemote: true
        };
      }
    }

    // 2. Fallback to LocalStorage
    await wait(300);
    const db = BackendService.getLocalDB();
    const tournament = db.tournaments.find(t => t.id === tournamentId) || null;
    const matches = db.matches.filter(m => m.tournamentId === tournamentId).sort((a, b) => a.orderIndex - b.orderIndex);

    return { tournament, matches, isRemote: false };
  },

  // --- Update Match (Handles both) ---
  updateMatch: async (matchId, data, isRemote = false) => {
    if (isRemote && supabase) {
      // Remote Update
      const { error } = await supabase
        .from('matches')
        .update({ 
          scores: data.scores, 
          winner: data.winner, 
          is_complete: data.isComplete 
        })
        .eq('id', matchId);
        
      if (!error) {
        // Find tournament ID to broadcast event
        // Note: In a real app we might optimize this look up
        window.dispatchEvent(new CustomEvent(`tournament:update:remote`));
      }
    } else {
      // Local Update
      await wait(200);
      const db = BackendService.getLocalDB();
      const idx = db.matches.findIndex(m => m.id === matchId);
      if (idx !== -1) {
        db.matches[idx] = { ...db.matches[idx], ...data };
        BackendService.saveLocalDB(db);
        window.dispatchEvent(new CustomEvent(`tournament:update:${db.matches[idx].tournamentId}`));
      }
    }
  },

  // --- Sync Feature ---
  shareTournament: async (tournamentId) => {
    if (!supabase) throw new Error("Supabase not configured");

    // 1. Get Local Data
    const db = BackendService.getLocalDB();
    const tournament = db.tournaments.find(t => t.id === tournamentId);
    const matches = db.matches.filter(m => m.tournamentId === tournamentId);

    if (!tournament) throw new Error("Tournament not found locally");

    // 2. Upload Tournament
    const { error: tError } = await supabase.from('tournaments').upsert({
      id: tournament.id,
      created_at: tournament.createdAt,
      players: tournament.players,
      config: tournament.config
    });
    if (tError) throw tError;

    // 3. Upload Matches (Transform camelCase to snake_case for DB columns if needed, 
    // but our SQL uses snake_case, JS uses camelCase. We map them here)
    const formattedMatches = matches.map(m => ({
      id: m.id,
      tournament_id: m.tournamentId,
      team1: m.team1,
      team2: m.team2,
      scores: m.scores,
      winner: m.winner,
      is_complete: m.isComplete,
      order_index: m.orderIndex
    }));

    const { error: mError } = await supabase.from('matches').upsert(formattedMatches);
    if (mError) throw mError;

    return true;
  },

  subscribe: (tournamentId, callback, isRemote = false) => {
    if (isRemote && supabase) {
      // Real-time subscription for Supabase
      const channel = supabase
        .channel('public:matches')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${tournamentId}` }, callback)
        .subscribe();
      
      // Also listen for local triggers if we trigger them manually
      const localHandler = () => callback();
      window.addEventListener(`tournament:update:remote`, localHandler);

      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener(`tournament:update:remote`, localHandler);
      };
    } else {
      const handler = () => callback();
      window.addEventListener(`tournament:update:${tournamentId}`, handler);
      return () => window.removeEventListener(`tournament:update:${tournamentId}`, handler);
    }
  }
};