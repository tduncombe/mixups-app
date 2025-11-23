import React, { useState } from 'react';
import { Trophy, Users, X } from 'lucide-react';
import { ThemeToggle } from '../contexts/ThemeContext';
import { BackendService } from '../services/BackendService';
import { cn } from '../lib/utils';
import {
  cardVariants,
  buttonVariants,
  inputVariants,
  badgeVariants,
  labelVariants,
  headingVariants,
  descriptionVariants
} from '../lib/variants';

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
        <h1 className={headingVariants()}>2v2 Mix Ups</h1>
        <p className={descriptionVariants()}>Casual tournament manager for 2v2 Games</p>
      </div>

      <div className={cn(cardVariants(), 'space-y-4')}>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={cn(labelVariants({ withIcon: true }))}>
              <Users className="w-4 h-4 mr-2" /> Players
            </label>
            <button
              type="button"
              onClick={() => setPlayers([])}
              className={buttonVariants({ variant: 'ghost', size: 'sm' })}
            >
              Clear All
            </button>
          </div>
          <div className={inputVariants({ variant: 'container' })}>
            {players.map(player => (
              <span key={player} className={badgeVariants()}>
                {player}
                <button
                  type="button"
                  onClick={() => handleRemovePlayer(player)}
                  className={buttonVariants({ variant: 'remove' })}
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
            className={cn(inputVariants({ fullWidth: true }), 'mt-2')}
            placeholder="Type name and press Enter..."
            autoComplete="off"
          />
          <p className={cn(descriptionVariants({ variant: 'muted' }), 'mt-1 text-right')}>
            {players.length} players
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <label className={labelVariants({ variant: 'section' })}>Scoring</label>
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => setConfig({ ...config, scoringMode: 'POINTS' })}
                className={buttonVariants({
                  variant: 'config',
                  active: config.scoringMode === 'POINTS'
                })}
              >
                Points
              </button>
              <button
                onClick={() => setConfig({ ...config, scoringMode: 'WIN_LOSS' })}
                className={buttonVariants({
                  variant: 'config',
                  active: config.scoringMode === 'WIN_LOSS'
                })}
              >
                Win/Loss
              </button>
            </div>
          </div>
          <div>
            <label className={labelVariants({ variant: 'section' })}>Format</label>
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => setConfig({ ...config, scheduleMode: 'ROTATION' })}
                className={buttonVariants({
                  variant: 'config',
                  active: config.scheduleMode === 'ROTATION'
                })}
              >
                Partner Rotate
              </button>
              <button
                disabled
                className={buttonVariants({
                  variant: 'config',
                  disabled: true
                })}
              >
                League (Soon)
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={loading}
          className={cn(buttonVariants({ size: 'lg' }), 'flex items-center justify-center mt-4')}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Generate Schedule'
          )}
        </button>
      </div>
    </div>
  );
};
