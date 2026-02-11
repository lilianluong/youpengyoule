import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateRoundResult, advanceLevel, getNextKing, DECK_CONFIG } from "@/lib/game-logic";

interface GamePlayer {
  id: string;
  user_id: string;
  seat_position: number;
  current_level: number;
  graduation_count: number;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const supabase = await createClient();
  const { gameId } = await params;

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get rounds with king's side participants.
  const { data: rounds, error } = await supabase
    .from("rounds")
    .select(`
      *,
      king:user_profiles!rounds_king_user_id_fkey(display_name),
      round_kings_side(user_id, user_profiles(display_name))
    `)
    .eq("game_id", gameId)
    .order("round_number", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rounds: rounds || [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const supabase = await createClient();
  const { gameId } = await params;

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { kingsSidePlayerIds, townPoints } = body;

  if (!Array.isArray(kingsSidePlayerIds) || typeof townPoints !== "number") {
    return NextResponse.json(
      { error: "Invalid request. kingsSidePlayerIds and townPoints required." },
      { status: 400 }
    );
  }

  // Get game with current king and players.
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select(`
      *,
      game_players(*)
    `)
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (!game.current_king_user_id) {
    return NextResponse.json({ error: "No king selected" }, { status: 400 });
  }

  // Verify king is in king's side.
  if (!kingsSidePlayerIds.includes(game.current_king_user_id)) {
    kingsSidePlayerIds.push(game.current_king_user_id);
  }

  const playerCount = game.game_players.length;
  const deckConfig = DECK_CONFIG[playerCount];

  if (!deckConfig) {
    return NextResponse.json({ error: "Invalid player count" }, { status: 400 });
  }

  // Calculate round result.
  const result = calculateRoundResult(townPoints, deckConfig.decks, kingsSidePlayerIds.length, playerCount);

  // Determine winners and losers.
  // On tie, Town is considered "winner" for next king selection purposes
  const townPlayerIds = (game.game_players as GamePlayer[]).filter((p) => !kingsSidePlayerIds.includes(p.user_id)).map((p) => p.user_id);
  const winnerIds = result.isTie ? townPlayerIds : (result.kingsSideWon ? kingsSidePlayerIds : townPlayerIds);
  const loserIds = result.kingsSideWon ? townPlayerIds : kingsSidePlayerIds;

  // Get next round number.
  const { data: lastRound } = await supabase
    .from("rounds")
    .select("round_number")
    .eq("game_id", gameId)
    .order("round_number", { ascending: false })
    .limit(1)
    .single();

  const roundNumber = lastRound ? lastRound.round_number + 1 : 1;

  // Create round.
  const { data: round, error: roundError } = await supabase
    .from("rounds")
    .insert({
      game_id: gameId,
      round_number: roundNumber,
      king_user_id: game.current_king_user_id,
      town_points: townPoints,
      created_by: user.id,
    })
    .select()
    .single();

  if (roundError || !round) {
    return NextResponse.json({ error: roundError?.message || "Failed to create round" }, { status: 500 });
  }

  // Add king's side participants.
  const kingsSideRows = kingsSidePlayerIds.map(userId => ({
    round_id: round.id,
    game_id: gameId,
    user_id: userId,
  }));

  const { error: kingsSideError } = await supabase
    .from("round_kings_side")
    .insert(kingsSideRows);

  if (kingsSideError) {
    // Rollback: delete the round.
    await supabase.from("rounds").delete().eq("id", round.id);
    return NextResponse.json({ error: kingsSideError.message }, { status: 500 });
  }

  // Update player levels (only if not a tie).
  if (!result.isTie && result.levelChange > 0) {
    for (const player of game.game_players) {
      if (winnerIds.includes(player.user_id)) {
        const advancement = advanceLevel(player.current_level, result.levelChange);

        await supabase
          .from("game_players")
          .update({
            current_level: advancement.newLevel,
            graduation_count: player.graduation_count + (advancement.graduated ? 1 : 0),
          })
          .eq("id", player.id);
      }
    }
  }

  // Determine next king.
  const currentKing = (game.game_players as GamePlayer[]).find((p) => p.user_id === game.current_king_user_id);
  if (currentKing) {
    const nextKing = getNextKing(game.game_players, currentKing.seat_position, winnerIds);

    await supabase
      .from("games")
      .update({
        current_king_user_id: nextKing.user_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", gameId);
  }

  return NextResponse.json({ round }, { status: 201 });
}
