import { DECK_CONFIG } from "./game-logic";

export interface DeckRequirements {
  playerCount: number;
  decks: number;
  redJokers: number;
  blackJokers: number;
  cardsPerPlayer: number;
  kitty: number;
  totalCards: number;
}

/**
 * Get deck requirements for a given number of players.
 */
export function getDeckRequirements(playerCount: number): DeckRequirements | null {
  const config = DECK_CONFIG[playerCount];

  if (!config) {
    return null;
  }

  const totalCards = (playerCount * config.cardsPerPlayer) + config.kitty;

  return {
    playerCount,
    ...config,
    totalCards,
  };
}

/**
 * Check if a player count is valid (5-12).
 */
export function isValidPlayerCount(count: number): boolean {
  return count >= 5 && count <= 12;
}
