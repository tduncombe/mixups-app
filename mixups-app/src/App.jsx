import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
import { 
  Trophy, Users, Calendar, Share2, Medal, ArrowLeft,
  CheckCircle2, AlertCircle, Moon, Sun, X, TrendingUp, Shield, Flame, Activity
} from 'lucide-react';

/**
 * ==========================================
 * THEME CONTEXT
 * ==========================================
 */
const ThemeContext = createContext({ isDark: false, toggle: () => {} });

const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('mixups_theme');
    return saved ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('mixups_theme', JSON.stringify(isDark));
  }, [isDark]);

  const toggle = () => setIsDark(p => !p);

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      <div className={isDark ? "dark" : ""}>
        <div className="min-h-screen transition-colors duration-200 bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900">
          {children}
        </div>
      </div>
    </ThemeContext.Provider>
  );
};

const ThemeToggle = () => {
  const { isDark, toggle } = useContext(ThemeContext);
  return (
    <button 
      onClick={toggle} 
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
      title="Toggle Dark Mode"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};

/**
 * ==========================================
 * UTILITIES & SCHEDULER
 * ==========================================
 */

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).substring(2, 15);
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const Scheduler = {
  generateSchedule: (players, config) => {
    if (players.length < 4) return [];
    const matches = [];
    const playerCounts = {};
    players.forEach(p => playerCounts[p] = 0);

    const pairs = [];
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        pairs.push({ p1: players[i], p2: players[j], id: `${i}-${j}` });
      }
    }

    const usedPairIds = new Set();
    let stuck = false;

    while (!stuck) {
      stuck = true;
      let availablePairs = pairs.filter(p => !usedPairIds.has(p.id));
      if (availablePairs.length === 0) break;

      // Shuffle first, then Sort by Fairness (lowest combined play count)
      availablePairs.sort(() => 0.5 - Math.random());
      availablePairs.sort((a, b) => {
        const scoreA = playerCounts[a.p1] + playerCounts[a.p2];
        const scoreB = playerCounts[b.p1] + playerCounts[b.p2];
        return scoreA - scoreB;
      });

      for (let i = 0; i < availablePairs.length; i++) {
        const pair1 = availablePairs[i];
        let bestOpponent = null;
        let minOpponentScore = Infinity;

        for (let j = i + 1; j < availablePairs.length; j++) {
          const pair2 = availablePairs[j];
          const hasOverlap = pair1.p1 === pair2.p1 || pair1.p1 === pair2.p2 || pair1.p2 === pair2.p1 || pair1.p2 === pair2.p2;
          
          if (!hasOverlap) {
            const score = playerCounts[pair2.p1] + playerCounts[pair2.p2];
            if (score < minOpponentScore) {
              minOpponentScore = score;
              bestOpponent = pair2;
            }
          }
        }

        if (bestOpponent) {
          matches.push({
            id: generateUUID(),
            team1: [pair1.p1, pair1.p2],
            team2: [bestOpponent.p1, bestOpponent.p2],
            scores: { team1: null, team2: null },
            winner: null,
            isComplete: false,
            orderIndex: matches.length
          });
          usedPairIds.add(pair1.id);
          usedPairIds.add(bestOpponent.id);
          playerCounts[pair1.p1]++; playerCounts[pair1.p2]++;
          playerCounts[bestOpponent.p1]++; playerCounts[bestOpponent.p2]++;
          stuck = false;
          break;
        }
      }
    }
    return matches;
  }
};

/**
 * ==========================================
 * DATA LAYER
 * ==========================================
 */

const DB_KEY = 'mixups_v1_db';
const BackendService = {
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

const useTournament = (tournamentId) => {
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

/**
 * ==========================================
 * UI COMPONENTS
 * ==========================================
 */

const Spinner = () => (
  <div className="flex justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
  </div>
);

const PlayerModal = ({ player, matches, onClose }) => {
  if (!player) return null;

  // Calculate Advanced Stats
  const stats = useMemo(() => {
    const involved = matches.filter(m => m.isComplete && (m.team1.includes(player) || m.team2.includes(player)));
    const total = involved.length;
    
    if (total === 0) return null;

    // Sort by newest first for streak/history
    const sorted = [...involved].sort((a, b) => b.orderIndex - a.orderIndex);
    
    let wins = 0, pointsFor = 0, pointsAgainst = 0;
    let streakVal = 0;
    let streakType = null; // 'W' | 'L' | 'D'
    const history = [];
    const partners = {};

    // Streak Calculation Loop (consecutive from newest)
    for (const m of sorted) {
      const isT1 = m.team1.includes(player);
      const myTeam = isT1 ? 'team1' : 'team2';
      const result = m.winner === myTeam ? 'W' : (m.winner === 'draw' ? 'D' : 'L');

      if (streakType === null) {
        streakType = result;
        streakVal = 1;
      } else if (result === streakType) {
        streakVal++;
      } else {
        break; // Stop counting once the streak is broken
      }
    }

    // Total Stats Loop
    involved.forEach(m => {
      const isT1 = m.team1.includes(player);
      const myTeam = isT1 ? 'team1' : 'team2';
      const oppTeam = isT1 ? 'team2' : 'team1';
      const partner = isT1 ? m.team1.find(n => n !== player) : m.team2.find(n => n !== player);
      
      const won = m.winner === myTeam;
      const draw = m.winner === 'draw';
      
      if (won) wins++;
      pointsFor += (m.scores[myTeam] || 0);
      pointsAgainst += (m.scores[oppTeam] || 0);

      // Partner Stats
      if (partner) {
        if (!partners[partner]) partners[partner] = { played: 0, wins: 0 };
        partners[partner].played++;
        if (won) partners[partner].wins++;
      }
    });

    // History (Last 5)
    const last5 = sorted.slice(0, 5).map(m => {
      const isT1 = m.team1.includes(player);
      const myTeam = isT1 ? 'team1' : 'team2';
      return m.winner === myTeam ? 'W' : (m.winner === 'draw' ? 'D' : 'L');
    });

    return {
      played: total,
      wins,
      winRate: Math.round((wins/total)*100),
      ppg: (pointsFor/total).toFixed(1),
      papg: (pointsAgainst/total).toFixed(1),
      streak: `${streakType}${streakVal}`,
      streakType,
      last5,
      partners: Object.entries(partners).sort((a,b) => (b[1].wins/b[1].played) - (a[1].wins/a[1].played))
    };

  }, [player, matches]);

  if (!stats) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-sm w-full text-center">
        <h3 className="font-bold text-lg mb-2 dark:text-white">{player}</h3>
        <p className="text-gray-500">No completed matches yet.</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm transition-all animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-gray-50 dark:bg-gray-900 p-4 flex justify-between items-center border-b dark:border-gray-700">
          <div>
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{player}</h2>
             <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Player Card</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          
          {/* Primary Grid */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl text-center">
                <div className="text-xs text-gray-500 dark:text-indigo-300 mb-1 uppercase font-semibold">Win Rate</div>
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.winRate}%</div>
             </div>
             <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl text-center">
                <div className="text-xs text-gray-500 dark:text-orange-300 mb-1 uppercase font-semibold flex justify-center items-center gap-1"><Flame className="w-3 h-3" /> Cur. Streak</div>
                <div className={`text-2xl font-bold ${stats.streakType === 'W' ? 'text-orange-500' : 'text-gray-400'}`}>{stats.streak}</div>
             </div>
             <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase font-semibold flex justify-center items-center gap-1"><TrendingUp className="w-3 h-3" /> PPG</div>
                <div className="text-xl font-bold text-gray-800 dark:text-gray-200">{stats.ppg}</div>
             </div>
             <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase font-semibold flex justify-center items-center gap-1"><Shield className="w-3 h-3" /> Def Rtg</div>
                <div className="text-xl font-bold text-gray-800 dark:text-gray-200">{stats.papg}</div>
             </div>
          </div>

          {/* Form History */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Last 5 Games</h4>
            <div className="flex gap-2">
              {stats.last5.map((res, i) => (
                <div key={i} className={`h-8 flex-1 rounded-md flex items-center justify-center text-xs font-bold text-white ${
                  res === 'W' ? 'bg-green-500' : res === 'D' ? 'bg-gray-400' : 'bg-red-400'
                }`}>
                  {res}
                </div>
              ))}
              {[...Array(5 - stats.last5.length)].map((_, i) => (
                 <div key={`e-${i}`} className="h-8 flex-1 rounded-md bg-gray-100 dark:bg-gray-700"></div>
              ))}
            </div>
          </div>

          {/* Partner Synergy */}
          <div>
             <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Best Partners</h4>
             <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
               {stats.partners.length === 0 && <div className="text-sm text-gray-400 italic">No data yet</div>}
               {stats.partners.map(([name, s]) => (
                 <div key={name} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${(s.wins/s.played)*100}%` }}></div>
                      </div>
                      <span className="font-mono text-xs text-gray-500">{Math.round((s.wins/s.played)*100)}%</span>
                    </div>
                 </div>
               ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const MatchCard = ({ match, config }) => {
  const [localScores, setLocalScores] = useState(match.scores);
  const [isSaving, setIsSaving] = useState(false);

  const getCardStyle = () => {
    if (!match.isComplete) return "border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700";
    return "border-green-200 bg-green-50/50 dark:bg-green-900/20 dark:border-green-800";
  };

  const handleScoreChange = (team, val) => {
    const num = val === '' ? null : parseInt(val, 10);
    setLocalScores(prev => ({ ...prev, [team]: num }));
  };

  useEffect(() => {
    if (config.scoringMode !== 'POINTS') return;
    if (localScores.team1 !== match.scores.team1 || localScores.team2 !== match.scores.team2) {
      const timer = setTimeout(async () => {
        setIsSaving(true);
        let winner = null;
        let isComplete = false;
        if (localScores.team1 !== null && localScores.team2 !== null) {
          isComplete = true;
          if (localScores.team1 > localScores.team2) winner = 'team1';
          else if (localScores.team2 > localScores.team1) winner = 'team2';
          else winner = config.allowDraws ? 'draw' : null;
        }
        await BackendService.updateMatch(match.id, { scores: localScores, winner, isComplete });
        setIsSaving(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [localScores, match.scores, match.id, config]);

  const handleWinClick = async (winningTeam) => {
    setIsSaving(true);
    await BackendService.updateMatch(match.id, { winner: winningTeam, isComplete: true, scores: { team1: 0, team2: 0 } });
    setIsSaving(false);
  };

  const TeamDisplay = ({ members, winner }) => (
    <div className={`flex flex-col items-center ${winner ? 'text-green-700 dark:text-green-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
      <div className="flex -space-x-2 overflow-hidden mb-1">
         {members.map((m, i) => (
            <div key={i} className="h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-800 dark:text-indigo-200 uppercase">
              {m.substring(0, 2)}
            </div>
         ))}
      </div>
      <span className="text-sm text-center leading-tight">{members.join(" & ")}</span>
    </div>
  );

  return (
    <div className={`border rounded-xl shadow-sm p-4 mb-4 transition-all ${getCardStyle()} ${isSaving ? 'opacity-70' : ''}`}>
      <div className="flex justify-between items-center relative">
        {/* Team 1 */}
        <div className="flex-1 flex flex-col items-center">
          <TeamDisplay members={match.team1} winner={match.winner === 'team1'} />
          {config.scoringMode === 'WIN_LOSS' && (
             <button onClick={() => handleWinClick('team1')} className={`mt-2 px-3 py-1 text-xs rounded-full border transition-colors ${match.winner === 'team1' ? 'bg-green-600 text-white border-green-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>Winner</button>
          )}
        </div>
        {/* VS / Score */}
        <div className="flex flex-col items-center px-4">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono mb-1">MATCH {match.orderIndex + 1}</span>
          {config.scoringMode === 'POINTS' ? (
             <div className="flex items-center space-x-2">
               <input type="number" value={localScores.team1 ?? ''} onChange={(e) => handleScoreChange('team1', e.target.value)} className="w-12 h-10 text-center border rounded-md font-mono text-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="-" />
               <span className="text-gray-400 dark:text-gray-500">:</span>
               <input type="number" value={localScores.team2 ?? ''} onChange={(e) => handleScoreChange('team2', e.target.value)} className="w-12 h-10 text-center border rounded-md font-mono text-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="-" />
             </div>
          ) : (
             <div className="font-bold text-gray-300 dark:text-gray-600 text-xl">VS</div>
          )}
          {isSaving && <div className="absolute -top-2 right-0 text-[10px] text-gray-400 animate-pulse">Saving...</div>}
        </div>
        {/* Team 2 */}
        <div className="flex-1 flex flex-col items-center">
          <TeamDisplay members={match.team2} winner={match.winner === 'team2'} />
           {config.scoringMode === 'WIN_LOSS' && (
             <button onClick={() => handleWinClick('team2')} className={`mt-2 px-3 py-1 text-xs rounded-full border transition-colors ${match.winner === 'team2' ? 'bg-green-600 text-white border-green-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>Winner</button>
          )}
        </div>
      </div>
    </div>
  );
};

const Leaderboard = ({ players, matches, config, onSelectPlayer }) => {
  const stats = useMemo(() => {
    const map = {};
    players.forEach(p => map[p] = { name: p, played: 0, wins: 0, losses: 0, draws: 0, pointDiff: 0 });
    matches.forEach(m => {
      if (!m.isComplete) return;
      const t1Score = m.scores.team1 || 0;
      const t2Score = m.scores.team2 || 0;
      const diff = t1Score - t2Score;
      
      const update = (members, isWin, isDraw, pDiff) => members.forEach(p => {
        if(!map[p]) return;
        map[p].played++;
        if(isWin) map[p].wins++;
        if(isDraw) map[p].draws++;
        if(!isWin && !isDraw) map[p].losses++;
        map[p].pointDiff += pDiff;
      });
      update(m.team1, m.winner === 'team1', m.winner === 'draw', diff);
      update(m.team2, m.winner === 'team2', m.winner === 'draw', -diff);
    });
    return Object.values(map).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (config.scoringMode === 'POINTS') return b.pointDiff - a.pointDiff;
      return a.played - b.played;
    });
  }, [players, matches, config]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-medium border-b dark:border-gray-700">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Player</th>
            <th className="px-4 py-3 text-center">W</th>
            <th className="px-4 py-3 text-center">L</th>
            <th className="px-4 py-3 text-center hidden sm:table-cell">Played</th>
            {config.scoringMode === 'POINTS' && <th className="px-4 py-3 text-center">Diff</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {stats.map((s, i) => (
            <tr
              key={s.name}
              onClick={() => onSelectPlayer(s.name)}
              className={`cursor-pointer hover:bg-indigo-100/40 dark:hover:bg-gray-700 transition-colors ${i < 3 ? 'bg-indigo-50/10 dark:bg-indigo-500/10' : ''}`}
            >
              <td className="px-4 py-3 font-mono text-gray-400 dark:text-gray-500">{i + 1}</td>
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                 {s.name}
                 <Activity className="w-3 h-3 text-gray-400 dark:text-gray-500" />
              </td>
              <td className="px-4 py-3 text-center font-bold text-green-600 dark:text-green-400">{s.wins}</td>
              <td className="px-4 py-3 text-center text-red-500 dark:text-red-400">{s.losses}</td>
              <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 hidden sm:table-cell">{s.played}</td>
              {config.scoringMode === 'POINTS' && (
                <td className={`px-4 py-3 text-center font-mono ${s.pointDiff > 0 ? 'text-green-600 dark:text-green-400' : s.pointDiff < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400'}`}>
                  {s.pointDiff > 0 ? '+' : ''}{s.pointDiff}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-3 text-center text-xs text-gray-400 dark:text-gray-500 border-t dark:border-gray-700">
         Tap a player to view detailed stats
      </div>
    </div>
  );
};

const CreateView = ({ onCreate }) => {
  const [players, setPlayers] = useState("Alice\nBob\nCharlie\nDave\nEve");
  const [config, setConfig] = useState({ scoringMode: 'POINTS', allowDraws: false, scheduleMode: 'ROTATION' });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    const playerList = players.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    if (playerList.length < 4) { alert("Need at least 4 players!"); return; }
    setLoading(true);
    const id = await BackendService.createTournament(playerList, config);
    setLoading(false);
    onCreate(id);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 p-4">
      <div className="flex justify-end"><ThemeToggle /></div>
      <div className="text-center space-y-2 mb-8">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
          <Trophy className="text-white w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">2v2 Mix Ups</h1>
        <p className="text-gray-500 dark:text-gray-400">Casual tournament manager for Badminton & Pickleball</p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center"><Users className="w-4 h-4 mr-2" /> Players</label>
          <textarea value={players} onChange={e => setPlayers(e.target.value)} className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Enter names..." />
          <p className="text-xs text-gray-400 mt-1 text-right">{players.split('\n').filter(p=>p.trim()).length} players</p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Scoring</label>
            <div className="flex flex-col space-y-2">
              <button onClick={() => setConfig({ ...config, scoringMode: 'POINTS' })} className={`px-3 py-2 rounded-lg text-sm border text-left transition-all ${config.scoringMode === 'POINTS' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300'}`}>Points</button>
              <button onClick={() => setConfig({ ...config, scoringMode: 'WIN_LOSS' })} className={`px-3 py-2 rounded-lg text-sm border text-left transition-all ${config.scoringMode === 'WIN_LOSS' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300'}`}>Win/Loss</button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Format</label>
            <div className="flex flex-col space-y-2">
              <button onClick={() => setConfig({ ...config, scheduleMode: 'ROTATION' })} className={`px-3 py-2 rounded-lg text-sm border text-left transition-all ${config.scheduleMode === 'ROTATION' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-300'}`}>Partner Rotate</button>
              <button disabled className="px-3 py-2 rounded-lg text-sm border text-left text-gray-300 dark:text-gray-600 dark:border-gray-700 cursor-not-allowed bg-gray-50 dark:bg-gray-800">League (Soon)</button>
            </div>
          </div>
        </div>
        <button onClick={handleCreate} disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center mt-4">{loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Generate Schedule'}</button>
      </div>
    </div>
  );
};

const DashboardView = ({ tournamentId, onBack }) => {
  const { tournament, matches, loading, error } = useTournament(tournamentId);
  const [activeTab, setActiveTab] = useState('matches');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showCopied, setShowCopied] = useState(false);

  if (loading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;
  if (error || !tournament) return <div className="text-center p-8"><AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" /><h2 className="text-xl font-bold dark:text-white">Not Found</h2><button onClick={onBack} className="mt-4 text-indigo-600">Go Home</button></div>;

  const handleCopy = () => {
    const url = window.location.href; 
    
    // Fallback for iframe environments where clipboard API might be restricted
    const tryLegacyCopy = (text) => {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed"; 
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) {
                setShowCopied(true);
                setTimeout(() => setShowCopied(false), 2000);
            } else {
                alert("Could not auto-copy. Please copy the URL from your browser address bar manually.");
            }
        } catch (err) {
            alert("Could not auto-copy. Please copy the URL from your browser address bar manually.");
        }
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url)
            .then(() => {
                setShowCopied(true);
                setTimeout(() => setShowCopied(false), 2000);
            })
            .catch(() => tryLegacyCopy(url));
    } else {
        tryLegacyCopy(url);
    }
  };

  const completion = Math.round((matches.filter(m => m.isComplete).length / matches.length) * 100) || 0;

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-gray-50/50 dark:bg-gray-900 pb-20">
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" /></button>
          <div className="text-center">
            <h2 className="font-bold text-gray-900 dark:text-white">Tournament</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{tournament.players.length} Players • {tournament.config.scheduleMode}</p>
          </div>
          <div className="flex items-center -mr-2">
             <ThemeToggle />
             <button onClick={handleCopy} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full relative ml-1">
              {showCopied ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />}
            </button>
          </div>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-2 overflow-hidden">
          <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${completion}%` }} />
        </div>
      </div>

      <div className="flex p-4 space-x-2">
        <button onClick={() => setActiveTab('matches')} className={`flex-1 py-2 rounded-lg font-medium text-sm flex items-center justify-center transition-all ${activeTab === 'matches' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border dark:border-gray-700'}`}><Calendar className="w-4 h-4 mr-2" /> Matches</button>
        <button onClick={() => setActiveTab('leaderboard')} className={`flex-1 py-2 rounded-lg font-medium text-sm flex items-center justify-center transition-all ${activeTab === 'leaderboard' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border dark:border-gray-700'}`}><Medal className="w-4 h-4 mr-2" /> Leaderboard</button>
      </div>

      <div className="px-4">
        {activeTab === 'matches' ? (
          <div className="space-y-2">
            {matches.length === 0 && <div className="text-center py-10 text-gray-400">No matches generated.</div>}
            {matches.map(m => <MatchCard key={m.id} match={m} config={tournament.config} />)}
          </div>
        ) : (
          <Leaderboard 
            players={tournament.players} 
            matches={matches} 
            config={tournament.config} 
            onSelectPlayer={setSelectedPlayer}
          />
        )}
      </div>

      {/* Details Modal */}
      <PlayerModal 
        player={selectedPlayer} 
        matches={matches} 
        onClose={() => setSelectedPlayer(null)} 
      />
    </div>
  );
};

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