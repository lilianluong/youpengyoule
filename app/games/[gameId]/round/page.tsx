"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { calculateRoundResult, DECK_CONFIG } from "@/lib/game-logic";

interface Player {
  user_id: string;
  seat_position: number;
  current_level: number;
  user_profiles: {
    display_name: string;
  };
}

interface Game {
  id: string;
  name: string;
  current_king_user_id: string;
  game_players: Player[];
}

export default function RoundEntryPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;

  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [townPoints, setTownPoints] = useState<string>("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchGame();
  }, [gameId]);

  const fetchGame = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}`);
      const data = await response.json();
      setGame(data.game);
    } catch (error) {
      console.error("Failed to fetch game:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePartner = (userId: string) => {
    setSelectedPartners(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!townPoints) {
      setError("Please enter Town points");
      return;
    }

    setSubmitting(true);

    try {
      const kingsSidePlayerIds = game?.current_king_user_id
        ? [game.current_king_user_id, ...selectedPartners]
        : selectedPartners;

      const response = await fetch(`/api/games/${gameId}/rounds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kingsSidePlayerIds,
          townPoints: parseInt(townPoints),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create round");
      }

      router.push(`/games/${gameId}`);
    } catch (error) {
      setError("Failed to submit round. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="text-[#C67B5C] text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!game) {
    return null;
  }

  const king = game.game_players.find(p => p.user_id === game.current_king_user_id);
  const otherPlayers = game.game_players.filter(p => p.user_id !== game.current_king_user_id);

  const deckConfig = DECK_CONFIG[game.game_players.length];
  const townPointsNum = parseInt(townPoints) || 0;
  const preview = townPoints ? calculateRoundResult(townPointsNum, deckConfig.decks) : null;

  const kingsSideIds = [game.current_king_user_id, ...selectedPartners];
  const townIds = game.game_players.filter(p => !kingsSideIds.includes(p.user_id)).map(p => p.user_id);

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <header className="border-b-4 border-[#C67B5C] bg-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link
            href={`/games/${gameId}`}
            className="text-[#C67B5C] hover:text-[#8B4513] transition-colors inline-flex items-center gap-2 mb-4"
          >
            ← Back to game
          </Link>
          <h1
            className="text-5xl font-bold text-[#8B4513] tracking-tight"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Enter Round Result
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Current King */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-[#C67B5C]">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">👑</div>
              <div>
                <h2
                  className="text-2xl font-bold text-[#8B4513]"
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  Current King
                </h2>
                <p className="text-[#C67B5C] text-sm">Automatically on King's Side</p>
              </div>
            </div>
            <div className="bg-[#FFF8F0] rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#C67B5C] text-white flex items-center justify-center font-bold">
                  {king?.seat_position}
                </div>
                <div className="font-semibold text-[#8B4513] text-lg">
                  {king?.user_profiles.display_name}
                </div>
              </div>
            </div>
          </div>

          {/* Select Partners */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-[#C67B5C]">
            <h3
              className="text-2xl font-bold text-[#8B4513] mb-4"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              King's Side Partners
            </h3>
            <p className="text-[#C67B5C] mb-6">Select who played with the King</p>

            <div className="space-y-3">
              {otherPlayers.map((player) => (
                <label
                  key={player.user_id}
                  className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedPartners.includes(player.user_id)
                      ? "border-[#8B4513] bg-[#FFF8F0]"
                      : "border-[#C67B5C] hover:border-[#8B4513]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedPartners.includes(player.user_id)}
                      onChange={() => togglePartner(player.user_id)}
                      className="w-5 h-5 text-[#C67B5C] rounded focus:ring-[#8B4513]"
                    />
                    <div className="w-12 h-12 rounded-full bg-[#C67B5C] text-white flex items-center justify-center font-bold">
                      {player.seat_position}
                    </div>
                    <div className="font-semibold text-[#8B4513]">
                      {player.user_profiles.display_name}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Town Points */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-[#C67B5C]">
            <h3
              className="text-2xl font-bold text-[#8B4513] mb-4"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Town Points
            </h3>
            <p className="text-[#C67B5C] mb-6">
              Total points scored by Town (max {deckConfig.decks * 100})
            </p>
            <input
              type="number"
              min="0"
              max={deckConfig.decks * 100}
              value={townPoints}
              onChange={(e) => setTownPoints(e.target.value)}
              placeholder="e.g., 75"
              className="w-full px-4 py-3 border-2 border-[#C67B5C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] text-2xl font-bold text-[#8B4513]"
              required
            />
          </div>

          {/* Preview */}
          {preview && (
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-[#8B4513]">
              <h3
                className="text-2xl font-bold text-[#8B4513] mb-6"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Round Preview
              </h3>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className={`p-6 rounded-xl ${preview.kingsSideWon ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'}`}>
                  <div className="text-center mb-4">
                    <div className="text-lg font-semibold text-[#8B4513] mb-2">King's Side</div>
                    {preview.kingsSideWon && <div className="text-3xl mb-2">🎉</div>}
                  </div>
                  <div className="space-y-2">
                    {game.game_players
                      .filter(p => kingsSideIds.includes(p.user_id))
                      .map(p => (
                        <div key={p.user_id} className="text-sm text-[#8B4513] flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#C67B5C] text-white flex items-center justify-center text-xs">
                            {p.seat_position}
                          </span>
                          {p.user_profiles.display_name}
                          {p.user_id === game.current_king_user_id && " 👑"}
                        </div>
                      ))}
                  </div>
                </div>

                <div className={`p-6 rounded-xl ${!preview.kingsSideWon ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'}`}>
                  <div className="text-center mb-4">
                    <div className="text-lg font-semibold text-[#8B4513] mb-2">Town</div>
                    {!preview.kingsSideWon && <div className="text-3xl mb-2">🎉</div>}
                  </div>
                  <div className="space-y-2">
                    {game.game_players
                      .filter(p => townIds.includes(p.user_id))
                      .map(p => (
                        <div key={p.user_id} className="text-sm text-[#8B4513] flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#C67B5C] text-white flex items-center justify-center text-xs">
                            {p.seat_position}
                          </span>
                          {p.user_profiles.display_name}
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="bg-[#FFF8F0] rounded-lg p-4 text-center">
                <div className="text-[#C67B5C] text-sm mb-2">Winners advance by</div>
                <div className="text-4xl font-bold text-[#8B4513]">
                  {preview.levelChange} {preview.levelChange === 1 ? 'level' : 'levels'}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !townPoints}
            className="w-full py-4 bg-[#C67B5C] text-white font-bold text-lg rounded-xl hover:bg-[#8B4513] transition-all transform hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {submitting ? "Submitting..." : "Submit Round Result"}
          </button>
        </form>
      </main>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap');
      `}</style>
    </div>
  );
}
