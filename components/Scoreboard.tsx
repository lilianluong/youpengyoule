interface Player {
  user_id: string;
  seat_position: number;
  current_level: number;
  graduation_count: number;
  is_active?: boolean;
  user_profiles: {
    display_name: string;
    email: string;
    profile_picture_url?: string | null;
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
          const isPaused = player.is_active === false;
          const levelCard = player.current_level === 14 ? 'A' : player.current_level.toString();

          return (
            <div
              key={player.user_id}
              className={`p-4 transition-all ${
                isPaused
                  ? "opacity-50 bg-gray-50"
                  : isKing
                  ? "bg-[#FFF8F0]"
                  : "hover:bg-[#FFF8F0]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14">
                    {player.user_profiles.profile_picture_url ? (
                      <img
                        src={player.user_profiles.profile_picture_url}
                        alt={player.user_profiles.display_name}
                        className={`w-14 h-14 rounded-full object-cover border-2 ${isPaused ? "border-gray-300 grayscale" : "border-[#C67B5C]"}`}
                      />
                    ) : (
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${isPaused ? "bg-gray-300 border-gray-300" : "bg-gradient-to-br from-[#C67B5C] to-[#8B4513] border-[#C67B5C]"}`}>
                        <span className="text-white text-xl font-bold">
                          {player.user_profiles.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#8B4513] text-white flex items-center justify-center text-xs font-bold border-2 border-white">
                      {player.seat_position}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-lg ${isPaused ? "text-gray-500" : "text-[#8B4513]"}`}>
                        {player.user_profiles.display_name}
                      </span>
                      {isKing && (
                        <span className="px-2 py-1 bg-[#C67B5C] text-white text-xs font-bold rounded">
                          👑 KING
                        </span>
                      )}
                      {isPaused && (
                        <span className="px-2 py-1 bg-gray-400 text-white text-xs font-bold rounded">
                          PAUSED
                        </span>
                      )}
                    </div>
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
                    <div className={`text-sm mb-1 ${isPaused ? "text-gray-400" : "text-[#C67B5C]"}`}>Level</div>
                    <div className={`text-3xl font-bold ${isPaused ? "text-gray-400" : "text-[#8B4513]"}`} style={{ fontFamily: "'DM Serif Display', serif" }}>
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
