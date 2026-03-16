"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Scoreboard from "@/components/Scoreboard";
import DeckRequirements from "@/components/DeckRequirements";
import RoundHistory from "@/components/RoundHistory";

interface Player {
  user_id: string;
  seat_position: number;
  current_level: number;
  graduation_count: number;
  is_active: boolean;
  user_profiles: {
    display_name: string;
    email: string;
  };
}

interface UserProfile {
  user_id: string;
  display_name: string;
  email: string;
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
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKingModal, setShowKingModal] = useState(false);
  const [selectingKing, setSelectingKing] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [managingPlayer, setManagingPlayer] = useState<string | null>(null);
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [selectedNewUser, setSelectedNewUser] = useState<string>("");
  const [insertAfterSeat, setInsertAfterSeat] = useState<string>("");

  useEffect(() => {
    fetchGame();
    fetchRounds();
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

  const fetchRounds = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}/rounds`);
      const data = await response.json();
      setRounds(data.rounds || []);
    } catch (error) {
      console.error("Failed to fetch rounds:", error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      setAllUsers(data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
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

  const handleOpenManageModal = () => {
    setShowManageModal(true);
    fetchAllUsers();
    setSelectedNewUser("");
    setInsertAfterSeat("");
  };

  const handleTogglePause = async (player: Player) => {
    setManagingPlayer(player.user_id);
    try {
      const response = await fetch(`/api/games/${gameId}/players`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: player.user_id, is_active: !player.is_active }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to update player");
        return;
      }

      await fetchGame();
    } catch (error) {
      console.error("Failed to update player:", error);
    } finally {
      setManagingPlayer(null);
    }
  };

  const handleAddPlayer = async () => {
    if (!selectedNewUser) return;
    setAddingPlayer(true);
    try {
      const insertAfterSeatPosition =
        insertAfterSeat === "" || insertAfterSeat === "start"
          ? null
          : parseInt(insertAfterSeat);

      const response = await fetch(`/api/games/${gameId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedNewUser, insertAfterSeatPosition }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to add player");
        return;
      }

      setSelectedNewUser("");
      setInsertAfterSeat("");
      await fetchGame();
    } catch (error) {
      console.error("Failed to add player:", error);
    } finally {
      setAddingPlayer(false);
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

  const activePlayers = game.game_players.filter((p) => p.is_active !== false);
  const existingUserIds = new Set(game.game_players.map((p) => p.user_id));
  const availableUsers = allUsers.filter((u) => !existingUserIds.has(u.user_id));
  const sortedPlayers = [...game.game_players].sort((a, b) => a.seat_position - b.seat_position);

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
                  {activePlayers.length === game.game_players.length
                    ? `${game.game_players.length} players`
                    : `${activePlayers.length} active / ${game.game_players.length} players`}
                </span>
                <span className="text-[#C67B5C]">•</span>
                <span className="text-[#C67B5C] text-sm">
                  {new Date(game.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap justify-end">
              <button
                onClick={handleOpenManageModal}
                className="px-6 py-3 bg-white text-[#8B4513] font-semibold rounded-lg border-2 border-[#C67B5C] hover:bg-[#FFF8F0] transition-all shadow-lg"
              >
                Manage Players
              </button>

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
            <DeckRequirements playerCount={activePlayers.length} />
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

        {/* Round History */}
        <div className="mt-8" style={{ animation: "fadeInUp 0.5s ease-out 0.3s", opacity: 0 }}>
          <RoundHistory rounds={rounds} playerCount={activePlayers.length} />
        </div>
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
              {game.game_players.filter(p => p.is_active !== false).map((player) => (
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

      {/* Manage Players Modal */}
      {showManageModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          style={{ animation: "fadeIn 0.2s ease-out" }}
          onClick={() => setShowManageModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border-4 border-[#C67B5C]"
            style={{ animation: "scaleIn 0.3s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-3xl font-bold text-[#8B4513] mb-6"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Manage Players
            </h2>

            {/* Pause / Resume existing players */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#8B4513] mb-3">Current Players</h3>
              <div className="space-y-2">
                {sortedPlayers.map((player) => {
                  const isKing = player.user_id === game.current_king_user_id;
                  const isPaused = player.is_active === false;
                  const isLoading = managingPlayer === player.user_id;
                  return (
                    <div
                      key={player.user_id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 ${isPaused ? "border-gray-200 bg-gray-50 opacity-60" : "border-[#C67B5C] bg-[#FFF8F0]"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#8B4513] text-white flex items-center justify-center text-sm font-bold">
                          {player.seat_position}
                        </div>
                        <span className="font-semibold text-[#8B4513]">
                          {player.user_profiles.display_name}
                        </span>
                        {isKing && (
                          <span className="px-2 py-0.5 bg-[#C67B5C] text-white text-xs font-bold rounded">
                            👑 KING
                          </span>
                        )}
                        {isPaused && (
                          <span className="px-2 py-0.5 bg-gray-400 text-white text-xs font-bold rounded">
                            PAUSED
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleTogglePause(player)}
                        disabled={isKing || isLoading}
                        title={isKing ? "Cannot pause the current king" : undefined}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                          isPaused
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {isLoading ? "..." : isPaused ? "Resume" : "Pause"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add new player */}
            {game.game_players.length < 12 && (
              <div className="border-t-2 border-[#FFF8F0] pt-6">
                <h3 className="text-lg font-semibold text-[#8B4513] mb-3">Add New Player</h3>
                <p className="text-sm text-[#C67B5C] mb-4">
                  New players start at level 2.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[#8B4513] mb-1">
                      Player
                    </label>
                    <select
                      value={selectedNewUser}
                      onChange={(e) => setSelectedNewUser(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-[#C67B5C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] text-[#8B4513]"
                    >
                      <option value="">Select a player...</option>
                      {availableUsers.map((u) => (
                        <option key={u.user_id} value={u.user_id}>
                          {u.display_name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#8B4513] mb-1">
                      Position in circle
                    </label>
                    <select
                      value={insertAfterSeat}
                      onChange={(e) => setInsertAfterSeat(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-[#C67B5C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] text-[#8B4513]"
                    >
                      <option value="start">At the start (before seat 0)</option>
                      {sortedPlayers.map((p) => (
                        <option key={p.user_id} value={p.seat_position}>
                          After seat {p.seat_position} — {p.user_profiles.display_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleAddPlayer}
                    disabled={!selectedNewUser || addingPlayer}
                    className="w-full py-2.5 bg-[#C67B5C] text-white font-semibold rounded-lg hover:bg-[#8B4513] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingPlayer ? "Adding..." : "Add Player"}
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowManageModal(false)}
              className="mt-6 w-full py-3 text-[#C67B5C] hover:text-[#8B4513] transition-colors"
            >
              Done
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
