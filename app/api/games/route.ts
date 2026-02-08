import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all games where the user is a participant.
  const { data, error } = await supabase
    .from("games")
    .select(`
      *,
      game_players!inner(user_id)
    `)
    .eq("game_players.user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ games: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, playerIds } = body;

  console.log("Creating game with:", { name, playerIds, userId: user.id });

  if (!name || !playerIds || !Array.isArray(playerIds) || playerIds.length < 5 || playerIds.length > 12) {
    return NextResponse.json(
      { error: "Invalid request. Name and 5-12 playerIds required." },
      { status: 400 }
    );
  }

  // Verify all player IDs exist.
  const { data: profiles, error: profilesError } = await supabase
    .from("user_profiles")
    .select("user_id")
    .in("user_id", playerIds);

  if (profilesError || !profiles || profiles.length !== playerIds.length) {
    console.error("Profile validation error:", profilesError, "Found:", profiles?.length, "Expected:", playerIds.length);
    return NextResponse.json({ error: "Invalid player IDs" }, { status: 400 });
  }

  // Create game.
  const { data: game, error: gameError } = await supabase
    .from("games")
    .insert({
      name,
      created_by: user.id,
    })
    .select()
    .single();

  if (gameError || !game) {
    console.error("Game creation error:", gameError);
    return NextResponse.json({ error: gameError?.message || "Failed to create game" }, { status: 500 });
  }

  // Create game_players in order (seat positions).
  const gamePlayers = playerIds.map((playerId, index) => ({
    game_id: game.id,
    user_id: playerId,
    seat_position: index,
  }));

  const { error: playersError } = await supabase
    .from("game_players")
    .insert(gamePlayers);

  if (playersError) {
    console.error("Game players creation error:", playersError);
    // Rollback: delete the game.
    await supabase.from("games").delete().eq("id", game.id);
    return NextResponse.json({ error: playersError.message }, { status: 500 });
  }

  return NextResponse.json({ game }, { status: 201 });
}
