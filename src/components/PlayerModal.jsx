import React, { useMemo } from 'react';
import { X, Flame, TrendingUp, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  modalOverlayVariants,
  modalContentVariants,
  buttonVariants,
  statCardVariants,
  statLabelVariants,
  statValueVariants,
  badgeVariants,
  headingVariants
} from '../lib/variants';

export const PlayerModal = ({ player, matches, onClose }) => {
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
    <div className={modalOverlayVariants()} onClick={onClose}>
      <div className={modalContentVariants()}>
        <h3 className={cn(headingVariants({ size: 'sm' }), 'mb-2')}>{player}</h3>
        <p className="text-gray-500">No completed matches yet.</p>
      </div>
    </div>
  );

  return (
    <div
      className={cn(modalOverlayVariants(), 'transition-all animate-in fade-in duration-200')}
      onClick={onClose}
    >
      <div
        className={cn(modalContentVariants({ variant: 'complex' }), 'w-full')}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-50 dark:bg-gray-900 p-4 flex justify-between items-center border-b dark:border-gray-700">
          <div>
            <h2 className={headingVariants({ size: 'md' })}>{player}</h2>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Player Card</p>
          </div>
          <button onClick={onClose} className={buttonVariants({ variant: 'modal' })}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-6">

          {/* Primary Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className={statCardVariants({ variant: 'primary' })}>
              <div className={statLabelVariants({ variant: 'primary' })}>Win Rate</div>
              <div className={statValueVariants({ variant: 'primary' })}>{stats.winRate}%</div>
            </div>
            <div className={statCardVariants({ variant: 'accent' })}>
              <div className={cn(statLabelVariants({ variant: 'accent' }), 'flex justify-center items-center gap-1')}>
                <Flame className="w-3 h-3" /> Cur. Streak
              </div>
              <div className={statValueVariants({
                variant: stats.streakType === 'W' ? 'accent' : 'neutral'
              })}>
                {stats.streak}
              </div>
            </div>
            <div className={statCardVariants()}>
              <div className={cn(statLabelVariants(), 'flex justify-center items-center gap-1')}>
                <TrendingUp className="w-3 h-3" /> PPG
              </div>
              <div className={statValueVariants({ size: 'md' })}>{stats.ppg}</div>
            </div>
            <div className={statCardVariants()}>
              <div className={cn(statLabelVariants(), 'flex justify-center items-center gap-1')}>
                <Shield className="w-3 h-3" /> Def Rtg
              </div>
              <div className={statValueVariants({ size: 'md' })}>{stats.papg}</div>
            </div>
          </div>

          {/* Form History */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Last 5 Games</h4>
            <div className="flex gap-2">
              {stats.last5.map((res, i) => (
                <div
                  key={i}
                  className={badgeVariants({
                    variant: res === 'W' ? 'win' : res === 'D' ? 'draw' : 'loss',
                    rounded: 'md'
                  })}
                >
                  {res}
                </div>
              ))}
              {[...Array(5 - stats.last5.length)].map((_, i) => (
                <div key={`e-${i}`} className={badgeVariants({ variant: 'empty', rounded: 'md' })}></div>
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
