"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Scoreboard from "@/components/Scoreboard";
import DeckRequirements from "@/components/DeckRequirements";

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

interface Game {
  id: string;
  name: string;
  current_king_user_id: string | null;
  status: string;
  created_at: string;
  game_players: Player[];
}

export default function GameDetailPage() {
  const params = useParams();
  const gameId = params.gameId as string;

  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [showKingModal, setShowKingModal] = useState(false);
  const [selectingKing, setSelectingKing] = useState(false);

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

  const handleSelectKing = async (userId: string) => {
    setSelectingKing(true);
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_king_user_id: userId }),
      });

      if (response.ok) {
        await fetchGame();
        setShowKingModal(false);
      }
    } catch (error) {
      console.error("Failed to select king:", error);
    } finally {
      setSelectingKing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="text-[#C67B5C] text-xl animate-pulse">Loading game...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🃏</div>
          <div className="text-[#8B4513] text-xl mb-4">Game not found</div>
          <Link href="/games" className="text-[#C67B5C] hover:text-[#8B4513]">
            ← Back to games
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* Header */}
      <header className="border-b-4 border-[#C67B5C] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Link
            href="/games"
            className="text-[#C67B5C] hover:text-[#8B4513] transition-colors inline-flex items-center gap-2 mb-4"
          >
            ← Back to games
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1
                className="text-5xl font-bold text-[#8B4513] tracking-tight mb-2"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                {game.name}
              </h1>
              <div className="flex gap-3 items-center">
                <span className="text-[#C67B5C] text-sm">
                  {game.game_players.length} players
                </span>
                <span className="text-[#C67B5C]">•</span>
                <span className="text-[#C67B5C] text-sm">
                  {new Date(game.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              {!game.current_king_user_id && (
                <button
                  onClick={() => setShowKingModal(true)}
                  className="px-6 py-3 bg-[#8B4513] text-white font-semibold rounded-lg hover:bg-[#C67B5C] transition-all transform hover:scale-105 shadow-lg"
                >
                  👑 Select First King
                </button>
              )}

              {game.current_king_user_id && (
                <Link
                  href={`/games/${gameId}/round`}
                  className="px-6 py-3 bg-[#C67B5C] text-white font-semibold rounded-lg hover:bg-[#8B4513] transition-all transform hover:scale-105 shadow-lg"
                >
                  Enter Round Result
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column - Scoreboard */}
          <div className="lg:col-span-2" style={{ animation: "fadeInUp 0.5s ease-out" }}>
            <Scoreboard
              players={game.game_players}
              currentKingUserId={game.current_king_user_id}
            />
          </div>

          {/* Side column - Deck Requirements */}
          <div style={{ animation: "fadeInUp 0.5s ease-out 0.1s", opacity: 0 }}>
            <DeckRequirements playerCount={game.game_players.length} />
          </div>
        </div>

        {!game.current_king_user_id && (
          <div
            className="mt-8 bg-white border-2 border-[#C67B5C] rounded-2xl p-8 text-center"
            style={{ animation: "fadeInUp 0.5s ease-out 0.2s", opacity: 0 }}
          >
            <div className="text-6xl mb-4">👑</div>
            <h3
              className="text-2xl font-bold text-[#8B4513] mb-2"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Ready to start?
            </h3>
            <p className="text-[#C67B5C] mb-6">
              Select the first King to begin tracking scores
            </p>
            <button
              onClick={() => setShowKingModal(true)}
              className="px-8 py-3 bg-[#C67B5C] text-white font-semibold rounded-lg hover:bg-[#8B4513] transition-all transform hover:scale-105 shadow-lg"
            >
              Select First King
            </button>
          </div>
        )}
      </main>

      {/* King Selection Modal */}
      {showKingModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          style={{ animation: "fadeIn 0.2s ease-out" }}
          onClick={() => !selectingKing && setShowKingModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border-4 border-[#C67B5C]"
            style={{ animation: "scaleIn 0.3s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-3xl font-bold text-[#8B4513] mb-6"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Select First King
            </h2>

            <p className="text-[#C67B5C] mb-6">
              Choose who will be the King for the first round
            </p>

            <div className="space-y-3">
              {game.game_players.map((player) => (
                <button
                  key={player.user_id}
                  onClick={() => handleSelectKing(player.user_id)}
                  disabled={selectingKing}
                  className="w-full p-4 rounded-lg border-2 border-[#C67B5C] hover:border-[#8B4513] hover:bg-[#FFF8F0] transition-all text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#C67B5C] text-white flex items-center justify-center font-bold">
                      {player.seat_position}
                    </div>
                    <div>
                      <div className="font-semibold text-[#8B4513] text-lg">
                        {player.user_profiles.display_name}
                      </div>
                      <div className="text-sm text-[#C67B5C]">
                        {player.user_profiles.email}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowKingModal(false)}
              disabled={selectingKing}
              className="mt-6 w-full py-3 text-[#C67B5C] hover:text-[#8B4513] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap');

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
