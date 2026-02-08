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
  isTie: boolean;
  levelChange: number;
}

/**
 * Get maximum team size (King + Friends) based on player count.
 */
export function getMaxTeamSize(playerCount: number): number {
  if (playerCount <= 7) return 3; // Call 1-2 friends
  if (playerCount <= 9) return 4; // Call 3 friends
  if (playerCount <= 11) return 5; // Call 4 friends
  return 6; // Call 5 friends
}

/**
 * Calculate round result based on Town points and King's Side team size.
 *
 * Rules from Pagat:
 * - Town needs >= 60 points/deck to win
 * - Base promotions: 0 pts = +3, 5-35 pts = +2, 40-75 pts = +1, 80-115 pts = tie, 120-155 pts = +1, 160-195 pts = +2, 200 pts = +3
 * - Bonus: For each player King's Side is short of max team size, double the promotion
 */
export function calculateRoundResult(
  townPoints: number,
  deckCount: number,
  kingsSideCount: number,
  playerCount: number
): RoundResult {
  const maxPoints = 100 * deckCount; // 200 for 2 decks
  const maxTeamSize = getMaxTeamSize(playerCount);
  const teamShortfall = maxTeamSize - kingsSideCount;

  // Determine outcome and base level change
  const kingsSideWon = townPoints < (40 * deckCount); // < 80 for 2 decks
  const isTie = townPoints >= (40 * deckCount) && townPoints < (60 * deckCount); // 80-119 for 2 decks
  const townWon = townPoints >= (60 * deckCount); // >= 120 for 2 decks

  let baseLevelChange: number;

  if (isTie) {
    // Tie: no level changes
    baseLevelChange = 0;
  } else if (kingsSideWon) {
    // King's Side wins - base promotion based on Town points
    if (townPoints === 0) {
      baseLevelChange = 3;
    } else if (townPoints < (18 * deckCount)) { // < 36 for 2 decks (using 5-35 range)
      baseLevelChange = 2;
    } else { // 40-79 for 2 decks
      baseLevelChange = 1;
    }
    // Apply team size bonus: multiply by (1 + shortfall)
    baseLevelChange = baseLevelChange * (1 + teamShortfall);
  } else {
    // Town wins - no team size bonus for Town
    if (townPoints === maxPoints) {
      baseLevelChange = 3;
    } else if (townPoints >= (80 * deckCount)) { // >= 160 for 2 decks
      baseLevelChange = 2;
    } else { // 120-159 for 2 decks
      baseLevelChange = 1;
    }
  }

  return { kingsSideWon, isTie, levelChange: baseLevelChange };
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
