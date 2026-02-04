import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  // Get game with players.
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select(`
      *,
      game_players (
        *,
        user_profiles (display_name, email)
      )
    `)
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  // Sort players by seat position.
  game.game_players.sort((a, b) => a.seat_position - b.seat_position);

  return NextResponse.json({ game });
}

export async function PATCH(
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
  const { current_king_user_id } = body;

  // Update game.
  const { data: game, error } = await supabase
    .from("games")
    .update({
      current_king_user_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", gameId)
    .select()
    .single();

  if (error || !game) {
    return NextResponse.json({ error: error?.message || "Failed to update game" }, { status: 500 });
  }

  return NextResponse.json({ game });
}
