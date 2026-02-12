"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Game {
  id: string;
  name: string;
  created_at: string;
  status: string;
  game_players: Array<{ user_id: string }>;
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch("/api/games");
      const data = await response.json();
      setGames(data.games || []);
    } catch (error) {
      console.error("Failed to fetch games:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <div className="text-[#C67B5C] text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* Header */}
      <header className="border-b-4 border-[#C67B5C] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex justify-between items-center">
          <div>
            <h1 className="text-5xl font-bold text-[#8B4513] tracking-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
              有朋友了
            </h1>
            <p className="text-[#C67B5C] mt-1 text-sm tracking-wide">找朋友 SCORE TRACKER</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/profile"
              className="px-4 py-2 text-sm text-[#8B4513] hover:text-[#C67B5C] transition-colors"
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-[#8B4513] hover:text-[#C67B5C] transition-colors"
            >
              Logout
            </button>
            <Link
              href="/games/new"
              className="px-6 py-3 bg-[#C67B5C] text-white font-semibold rounded-lg hover:bg-[#8B4513] transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              + New Game
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {games.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-block bg-white rounded-3xl p-12 shadow-2xl border-4 border-[#C67B5C] transform hover:rotate-1 transition-transform">
              <div className="text-8xl mb-6">🎴</div>
              <h2 className="text-4xl font-bold text-[#8B4513] mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
                No games yet
              </h2>
              <p className="text-[#C67B5C] mb-8 text-lg max-w-md mx-auto">
                Start a new game and invite your friends to track your 找朋友 scores!
              </p>
              <Link
                href="/games/new"
                className="inline-block px-8 py-4 bg-[#C67B5C] text-white font-bold rounded-xl hover:bg-[#8B4513] transition-all transform hover:scale-110 shadow-xl text-lg"
              >
                Create Your First Game
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game, index) => (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="group block"
                style={{
                  animation: `fadeInUp 0.5s ease-out forwards ${index * 0.1}s`,
                  opacity: 0,
                }}
              >
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-[#C67B5C] hover:border-[#8B4513] transition-all transform hover:-translate-y-2 hover:shadow-2xl">
                  {/* Card corner decoration */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#FFF8F0] border-2 border-[#C67B5C] flex items-center justify-center text-2xl">
                      🎴
                    </div>
                    <div className="text-xs text-[#C67B5C] bg-[#FFF8F0] px-3 py-1 rounded-full">
                      {game.game_players.length} players
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-[#8B4513] mb-2 group-hover:text-[#C67B5C] transition-colors" style={{ fontFamily: "'DM Serif Display', serif" }}>
                    {game.name}
                  </h3>

                  <div className="flex items-center justify-between text-sm text-[#C67B5C]">
                    <span>{new Date(game.created_at).toLocaleDateString()}</span>
                    <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

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
      `}</style>
    </div>
  );
}
