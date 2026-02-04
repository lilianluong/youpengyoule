// Deck configuration for different player counts (from Pagat).
export const DECK_CONFIG: Record<number, { decks: number; redJokers: number; blackJokers: number; cardsPerPlayer: number; kitty: number }> = {
  5: { decks: 2, redJokers: 2, blackJokers: 2, cardsPerPlayer: 20, kitty: 8 },
  6: { decks: 2, redJokers: 2, blackJokers: 2, cardsPerPlayer: 17, kitty: 6 },
  7: { decks: 2, redJokers: 0, blackJokers: 0, cardsPerPlayer: 14, kitty: 6 },
  8: { decks: 3, redJokers: 2, blackJokers: 0, cardsPerPlayer: 19, kitty: 6 },
  9: { decks: 3, redJokers: 3, blackJokers: 0, cardsPerPlayer: 17, kitty: 6 },
  10: { decks: 3, redJokers: 0, blackJokers: 0, cardsPerPlayer: 15, kitty: 6 },
  11: { decks: 3, redJokers: 2, blackJokers: 2, cardsPerPlayer: 14, kitty: 6 },
  12: { decks: 4, redJokers: 2, blackJokers: 0, cardsPerPlayer: 17, kitty: 6 },
};

export interface RoundResult {
  kingsSideWon: boolean;
  levelChange: number;
}

/**
 * Calculate round result based on Town points.
 *
 * Rules:
 * - King's Side wins if Town gets < 40 points/deck
 * - Town wins if Town gets >= 60 points/deck
 * - Between 40-60 is a tie, which counts as Town win
 * - Level change is based on margin (every 20 points/deck = 1 additional level)
 */
export function calculateRoundResult(townPoints: number, deckCount: number): RoundResult {
  const kingsSideWon = townPoints < (40 * deckCount);

  let levelChange: number;
  if (kingsSideWon) {
    // King's Side wins: measure from 40 threshold.
    const margin = (40 * deckCount) - townPoints;
    levelChange = Math.max(1, Math.floor(margin / (20 * deckCount)) + 1);
  } else {
    // Town wins (including tie 40-60): measure from 60 threshold.
    const margin = Math.max(0, townPoints - (60 * deckCount));
    levelChange = margin === 0 ? 1 : Math.floor(margin / (20 * deckCount)) + 1;
  }

  return { kingsSideWon, levelChange };
}

export interface LevelAdvancement {
  newLevel: number;
  graduated: boolean;
}

/**
 * Advance a player's level by the given change amount.
 * Levels go from 2-14 (14 = Ace). After 14, player graduates and returns to 2.
 */
export function advanceLevel(currentLevel: number, change: number): LevelAdvancement {
  const newLevel = currentLevel + change;

  if (newLevel > 14) {
    // Graduated! Return to level 2, but track that they graduated.
    return { newLevel: 2, graduated: true };
  }

  return { newLevel, graduated: false };
}

export interface Player {
  user_id: string;
  seat_position: number;
  current_level: number;
}

/**
 * Get the next king from the winners.
 * The next king is the first winner counter-clockwise from the current king.
 */
export function getNextKing(
  players: Player[],
  currentKingPosition: number,
  winnerIds: string[]
): Player {
  const sortedPlayers = [...players].sort((a, b) => a.seat_position - b.seat_position);

  for (let offset = 1; offset <= sortedPlayers.length; offset++) {
    const pos = (currentKingPosition + offset) % sortedPlayers.length;
    const player = sortedPlayers.find(p => p.seat_position === pos);

    if (player && winnerIds.includes(player.user_id)) {
      return player;
    }
  }

  // Fallback: should never happen if logic is correct.
  throw new Error("No valid next king found among winners");
}
