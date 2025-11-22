import { generateUUID, wait } from '../utils/helpers';
import { Scheduler } from '../utils/scheduler';

const DB_KEY = 'mixups_v1_db';

export const BackendService = {
  getDB: () => {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : { tournaments: [], matches: [] };
  },
  saveDB: (db) => localStorage.setItem(DB_KEY, JSON.stringify(db)),

  createTournament: async (players, config) => {
    await wait(600);
    const db = BackendService.getDB();
    const tournamentId = generateUUID();
    const tournament = { id: tournamentId, createdAt: new Date().toISOString(), players, config };
    const matches = Scheduler.generateSchedule(players, config).map(m => ({ ...m, tournamentId }));

    db.tournaments.push(tournament);
    db.matches = [...db.matches, ...matches];
    BackendService.saveDB(db);
    return tournamentId;
  },

  getTournamentData: async (tournamentId) => {
    await wait(300);
    const db = BackendService.getDB();
    const tournament = db.tournaments.find(t => t.id === tournamentId) || null;
    const matches = db.matches.filter(m => m.tournamentId === tournamentId).sort((a, b) => a.orderIndex - b.orderIndex);
    return { tournament, matches };
  },

  updateMatch: async (matchId, data) => {
    await wait(200);
    const db = BackendService.getDB();
    const idx = db.matches.findIndex(m => m.id === matchId);
    if (idx !== -1) {
      db.matches[idx] = { ...db.matches[idx], ...data };
      BackendService.saveDB(db);
      window.dispatchEvent(new CustomEvent(`tournament:update:${db.matches[idx].tournamentId}`));
    }
  },

  subscribe: (tournamentId, callback) => {
    const handler = () => callback();
    window.addEventListener(`tournament:update:${tournamentId}`, handler);
    return () => window.removeEventListener(`tournament:update:${tournamentId}`, handler);
  }
};
