import { DECK_CONFIG, calculateRoundResult } from "@/lib/game-logic";

interface Round {
  id: string;
  round_number: number;
  town_points: number;
  created_at: string;
  king: {
    display_name: string;
  };
  round_kings_side: Array<{
    user_id: string;
    user_profiles: {
      display_name: string;
    };
  }>;
}

interface RoundHistoryProps {
  rounds: Round[];
  playerCount: number;
}

export default function RoundHistory({ rounds, playerCount }: RoundHistoryProps) {
  const deckConfig = DECK_CONFIG[playerCount];

  if (!rounds || rounds.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-[#C67B5C] text-center">
        <div className="text-6xl mb-4">📝</div>
        <h3
          className="text-2xl font-bold text-[#8B4513] mb-2"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          No rounds yet
        </h3>
        <p className="text-[#C67B5C]">Round history will appear here after you play</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-[#C67B5C] overflow-hidden">
      <div className="bg-[#C67B5C] px-6 py-4">
        <h2
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          Round History
        </h2>
      </div>

      <div className="divide-y-2 divide-[#FFF8F0]">
        {rounds.map((round) => {
          const result = calculateRoundResult(round.town_points, deckConfig.decks);
          const kingsSideNames = round.round_kings_side.map(
            (p) => p.user_profiles.display_name
          );

          return (
            <div key={round.id} className="p-6 hover:bg-[#FFF8F0] transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold text-[#8B4513]">
                      Round {round.round_number}
                    </span>
                    <span className="text-sm text-[#C67B5C]">
                      {new Date(round.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-[#C67B5C]">
                    King: <span className="text-[#8B4513] font-semibold">{round.king.display_name}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-[#C67B5C] mb-1">Town Points</div>
                  <div className="text-3xl font-bold text-[#8B4513]">
                    {round.town_points}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-lg ${
                    result.kingsSideWon
                      ? "bg-green-50 border-2 border-green-500"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-[#8B4513]">King's Side</span>
                    {result.kingsSideWon && <span>🎉</span>}
                  </div>
                  <div className="text-sm text-[#C67B5C] space-y-1">
                    {kingsSideNames.map((name, i) => (
                      <div key={i}>• {name}</div>
                    ))}
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg ${
                    !result.kingsSideWon
                      ? "bg-green-50 border-2 border-green-500"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-[#8B4513]">Town</span>
                    {!result.kingsSideWon && <span>🎉</span>}
                  </div>
                  <div className="text-sm text-[#C67B5C]">
                    +{result.levelChange} {result.levelChange === 1 ? "level" : "levels"}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
