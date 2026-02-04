interface Player {
  user_id: string;
  seat_position: number;
  current_level: number;
  graduation_count: number;
  user_profiles: {
    display_name: string;
    email: string;
  };
}

interface ScoreboardProps {
  players: Player[];
  currentKingUserId?: string | null;
}

export default function Scoreboard({ players, currentKingUserId }: ScoreboardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-[#C67B5C] overflow-hidden">
      <div className="bg-[#C67B5C] px-6 py-4">
        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Scoreboard
        </h2>
      </div>

      <div className="divide-y-2 divide-[#FFF8F0]">
        {players.map((player) => {
          const isKing = player.user_id === currentKingUserId;
          const levelCard = player.current_level === 14 ? 'A' : player.current_level.toString();

          return (
            <div
              key={player.user_id}
              className={`p-4 transition-all ${
                isKing ? "bg-[#FFF8F0]" : "hover:bg-[#FFF8F0]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#C67B5C] text-white flex items-center justify-center font-bold">
                    {player.seat_position}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#8B4513] text-lg">
                        {player.user_profiles.display_name}
                      </span>
                      {isKing && (
                        <span className="px-2 py-1 bg-[#C67B5C] text-white text-xs font-bold rounded">
                          👑 KING
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-[#C67B5C]">{player.user_profiles.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {player.graduation_count > 0 && (
                    <div className="text-center">
                      <div className="text-2xl">🎓</div>
                      <div className="text-xs text-[#C67B5C] mt-1">
                        × {player.graduation_count}
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <div className="text-sm text-[#C67B5C] mb-1">Level</div>
                    <div className="text-3xl font-bold text-[#8B4513]" style={{ fontFamily: "'DM Serif Display', serif" }}>
                      {levelCard}
                    </div>
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
