"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  user_id: string;
  display_name: string;
  email: string;
}

export default function NewGamePage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [gameName, setGameName] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const togglePlayer = (userId: string) => {
    setSelectedPlayers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const movePlayer = (index: number, direction: "up" | "down") => {
    const newPlayers = [...selectedPlayers];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newPlayers[index], newPlayers[targetIndex]] = [newPlayers[targetIndex], newPlayers[index]];
    setSelectedPlayers(newPlayers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (selectedPlayers.length < 5 || selectedPlayers.length > 12) {
      setError("Please select 5-12 players");
      return;
    }

    if (!gameName.trim()) {
      setError("Please enter a game name");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: gameName,
          playerIds: selectedPlayers,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create game");
      }

      const data = await response.json();
      router.push(`/games/${data.game.id}`);
    } catch (error) {
      setError("Failed to create game. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* Header */}
      <header className="border-b-4 border-[#C67B5C] bg-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link href="/games" className="text-[#C67B5C] hover:text-[#8B4513] transition-colors inline-flex items-center gap-2 mb-4">
            ← Back to games
          </Link>
          <h1 className="text-5xl font-bold text-[#8B4513] tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Create New Game
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Game Name */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-[#C67B5C]">
            <label className="block text-2xl font-bold text-[#8B4513] mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Game Name
            </label>
            <input
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="e.g., Friday Night Game"
              className="w-full px-4 py-3 border-2 border-[#C67B5C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] text-lg"
              required
            />
          </div>

          {/* Player Selection */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-[#C67B5C]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#8B4513]" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Select Players
              </h2>
              <div className="text-sm text-[#C67B5C] bg-[#FFF8F0] px-4 py-2 rounded-full">
                {selectedPlayers.length} / 5-12 players
              </div>
            </div>

            <p className="text-[#C67B5C] mb-6">
              Select players in counter-clockwise seating order (starting from seat 0)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {users.map((user) => {
                const playerIndex = selectedPlayers.indexOf(user.user_id);
                const isSelected = playerIndex !== -1;

                return (
                  <button
                    key={user.user_id}
                    type="button"
                    onClick={() => togglePlayer(user.user_id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? "border-[#8B4513] bg-[#FFF8F0] shadow-md"
                        : "border-[#C67B5C] hover:border-[#8B4513] hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-[#8B4513]">{user.display_name}</div>
                        <div className="text-sm text-[#C67B5C]">{user.email}</div>
                      </div>
                      {isSelected && (
                        <div className="w-8 h-8 rounded-full bg-[#C67B5C] text-white flex items-center justify-center font-bold">
                          {playerIndex + 1}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Players Order */}
            {selectedPlayers.length > 0 && (
              <div className="border-t-2 border-[#C67B5C] pt-6">
                <h3 className="font-bold text-[#8B4513] mb-4">Seating Order (Counter-clockwise)</h3>
                <div className="space-y-2">
                  {selectedPlayers.map((userId, index) => {
                    const user = users.find(u => u.user_id === userId);
                    return (
                      <div key={userId} className="flex items-center gap-3 p-3 bg-[#FFF8F0] rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-[#C67B5C] text-white flex items-center justify-center font-bold text-sm">
                          {index}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-[#8B4513]">{user?.display_name}</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => movePlayer(index, "up")}
                            disabled={index === 0}
                            className="px-2 py-1 text-xs text-[#C67B5C] hover:text-[#8B4513] disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => movePlayer(index, "down")}
                            disabled={index === selectedPlayers.length - 1}
                            className="px-2 py-1 text-xs text-[#C67B5C] hover:text-[#8B4513] disabled:opacity-30"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || selectedPlayers.length < 5 || selectedPlayers.length > 12 || !gameName.trim()}
            className="w-full py-4 bg-[#C67B5C] text-white font-bold text-lg rounded-xl hover:bg-[#8B4513] transition-all transform hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? "Creating..." : "Create Game"}
          </button>
        </form>
      </main>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap');
      `}</style>
    </div>
  );
}
