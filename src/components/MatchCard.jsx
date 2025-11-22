import React, { useState, useEffect } from 'react';
import { BackendService } from '../services/BackendService';

export const MatchCard = ({ match, config }) => {
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
