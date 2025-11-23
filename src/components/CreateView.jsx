import React, { useState } from 'react';
import { Trophy, Users, X } from 'lucide-react';
import { ThemeToggle } from '../contexts/ThemeContext';
import { BackendService } from '../services/BackendService';

export const CreateView = ({ onCreate }) => {
  const [players, setPlayers] = useState(["Alice", "Bob", "Charlie", "Dave", "Eve"]);
  const [currentInput, setCurrentInput] = useState("");
  const [config, setConfig] = useState({ scoringMode: 'POINTS', allowDraws: false, scheduleMode: 'ROTATION' });
  const [loading, setLoading] = useState(false);

  const handleAddPlayer = (e) => {
    e.preventDefault();
    const trimmed = currentInput.trim();
    if (trimmed && !players.includes(trimmed)) {
      setPlayers([...players, trimmed]);
      setCurrentInput("");
    }
  };

  const handleRemovePlayer = (playerToRemove) => {
    setPlayers(players.filter(p => p !== playerToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddPlayer(e);
    }
  };

  const handleCreate = async () => {
    if (players.length < 4) { alert("Need at least 4 players!"); return; }
    setLoading(true);
    const id = await BackendService.createTournament(players, config);
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
        <p className="text-gray-500 dark:text-gray-400">Casual tournament manager for 2v2 Games</p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center"><Users className="w-4 h-4 mr-2" /> Players</label>
          <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-transparent dark:bg-gray-700 dark:border-gray-600 min-h-[42px]">
            {players.map(player => (
              <span key={player} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
                {player}
                <button
                  type="button"
                  onClick={() => handleRemovePlayer(player)}
                  className="hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={currentInput}
            onChange={e => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full mt-2 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Type name and press Enter..."
            autoComplete="off"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{players.length} players</p>
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
