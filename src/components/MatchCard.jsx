import React, { useState, useEffect } from 'react';
import { BackendService } from '../services/BackendService';
import { cn } from '../lib/utils';
import {
  cardVariants,
  buttonVariants,
  inputVariants,
  teamDisplayVariants,
  avatarVariants
} from '../lib/variants';

export const MatchCard = ({ match, config }) => {
  const [localScores, setLocalScores] = useState(match.scores);
  const [isSaving, setIsSaving] = useState(false);


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
    <div className={teamDisplayVariants({ winner })}>
      <div className="flex -space-x-2 overflow-hidden mb-1">
         {members.map((m, i) => (
            <div key={i} className={avatarVariants()}>
              {m.substring(0, 2)}
            </div>
         ))}
      </div>
      <span className="text-sm text-center leading-tight">{members.join(" & ")}</span>
    </div>
  );

  return (
    <div className={cn(
      cardVariants({
        variant: match.isComplete ? 'complete' : 'default',
        padding: 'sm',
        opacity: isSaving ? 'loading' : 'default'
      }),
      'mb-4'
    )}>
      <div className="flex justify-between items-center relative">
        {/* Team 1 */}
        <div className="flex-1 flex flex-col items-center">
          <TeamDisplay members={match.team1} winner={match.winner === 'team1'} />
          {config.scoringMode === 'WIN_LOSS' && (
            <button
              onClick={() => handleWinClick('team1')}
              className={buttonVariants({
                variant: 'winner',
                size: 'sm',
                winner: match.winner === 'team1'
              })}
            >
              Winner
            </button>
          )}
        </div>
        {/* VS / Score */}
        <div className="flex flex-col items-center px-4">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono mb-1">
            MATCH {match.orderIndex + 1}
          </span>
          {config.scoringMode === 'POINTS' ? (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={localScores.team1 ?? ''}
                onChange={(e) => handleScoreChange('team1', e.target.value)}
                className={inputVariants({ variant: 'score' })}
                placeholder="-"
              />
              <span className="text-gray-400 dark:text-gray-500">:</span>
              <input
                type="number"
                value={localScores.team2 ?? ''}
                onChange={(e) => handleScoreChange('team2', e.target.value)}
                className={inputVariants({ variant: 'score' })}
                placeholder="-"
              />
            </div>
          ) : (
            <div className="font-bold text-gray-300 dark:text-gray-600 text-xl">VS</div>
          )}
          {isSaving && (
            <div className="absolute -top-2 right-0 text-[10px] text-gray-400 animate-pulse">
              Saving...
            </div>
          )}
        </div>
        {/* Team 2 */}
        <div className="flex-1 flex flex-col items-center">
          <TeamDisplay members={match.team2} winner={match.winner === 'team2'} />
          {config.scoringMode === 'WIN_LOSS' && (
            <button
              onClick={() => handleWinClick('team2')}
              className={buttonVariants({
                variant: 'winner',
                size: 'sm',
                winner: match.winner === 'team2'
              })}
            >
              Winner
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
