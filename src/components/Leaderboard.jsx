import React, { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { cardVariants, statValueVariants, descriptionVariants } from '../lib/variants';

export const Leaderboard = ({ players, matches, config, onSelectPlayer }) => {
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
    <div className={cn(cardVariants({ padding: 'none' }), 'overflow-hidden')}>
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
              className={cn(
                'cursor-pointer hover:bg-indigo-100/40 dark:hover:bg-gray-700 transition-colors',
                i < 3 && 'bg-indigo-50/10 dark:bg-indigo-500/10'
              )}
            >
              <td className="px-4 py-3 font-mono text-gray-400 dark:text-gray-500">{i + 1}</td>
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                {s.name}
                <Activity className="w-3 h-3 text-gray-400 dark:text-gray-500" />
              </td>
              <td className={cn('px-4 py-3 text-center', statValueVariants({ variant: 'win', size: 'xs' }))}>
                {s.wins}
              </td>
              <td className={cn('px-4 py-3 text-center', statValueVariants({ variant: 'loss', size: 'xs' }))}>
                {s.losses}
              </td>
              <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                {s.played}
              </td>
              {config.scoringMode === 'POINTS' && (
                <td className={cn(
                  'px-4 py-3 text-center font-mono',
                  s.pointDiff > 0
                    ? 'text-green-600 dark:text-green-400'
                    : s.pointDiff < 0
                    ? 'text-red-500 dark:text-red-400'
                    : 'text-gray-400'
                )}>
                  {s.pointDiff > 0 ? '+' : ''}{s.pointDiff}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div className={cn(
        descriptionVariants({ variant: 'muted' }),
        'p-3 text-center border-t dark:border-gray-700'
      )}>
        Tap a player to view detailed stats
      </div>
    </div>
  );
};
