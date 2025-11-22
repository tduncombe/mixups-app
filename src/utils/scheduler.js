import { generateUUID } from './helpers';

export const Scheduler = {
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
