import { getDeckRequirements } from "@/lib/deck-requirements";

interface DeckRequirementsProps {
  playerCount: number;
}

export default function DeckRequirements({ playerCount }: DeckRequirementsProps) {
  const requirements = getDeckRequirements(playerCount);

  if (!requirements) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-[#C67B5C]">
      <h3 className="text-xl font-bold text-[#8B4513] mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
        Deck Requirements
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#FFF8F0] rounded-lg p-4">
          <div className="text-sm text-[#C67B5C] mb-1">Standard Decks</div>
          <div className="text-2xl font-bold text-[#8B4513]">{requirements.decks}</div>
        </div>

        <div className="bg-[#FFF8F0] rounded-lg p-4">
          <div className="text-sm text-[#C67B5C] mb-1">Total Cards</div>
          <div className="text-2xl font-bold text-[#8B4513]">{requirements.totalCards}</div>
        </div>

        {requirements.redJokers > 0 && (
          <div className="bg-[#FFF8F0] rounded-lg p-4">
            <div className="text-sm text-[#C67B5C] mb-1">Red Jokers</div>
            <div className="text-2xl font-bold text-[#8B4513]">{requirements.redJokers}</div>
          </div>
        )}

        {requirements.blackJokers > 0 && (
          <div className="bg-[#FFF8F0] rounded-lg p-4">
            <div className="text-sm text-[#C67B5C] mb-1">Black Jokers</div>
            <div className="text-2xl font-bold text-[#8B4513]">{requirements.blackJokers}</div>
          </div>
        )}

        <div className="bg-[#FFF8F0] rounded-lg p-4">
          <div className="text-sm text-[#C67B5C] mb-1">Cards/Player</div>
          <div className="text-2xl font-bold text-[#8B4513]">{requirements.cardsPerPlayer}</div>
        </div>

        <div className="bg-[#FFF8F0] rounded-lg p-4">
          <div className="text-sm text-[#C67B5C] mb-1">Kitty</div>
          <div className="text-2xl font-bold text-[#8B4513]">{requirements.kitty}</div>
        </div>
      </div>
    </div>
  );
}
