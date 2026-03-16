import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface GamePlayer {
  id: string;
  user_id: string;
  seat_position: number;
  current_level: number;
  graduation_count: number;
  is_active: boolean;
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
  const { userId, insertAfterSeatPosition } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  // Verify the requester is a participant of this game.
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id, current_king_user_id, game_players(*)")
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const players = game.game_players as GamePlayer[];

  // Check requester is in the game.
  if (!players.some((p) => p.user_id === user.id)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Check new player isn't already in the game.
  if (players.some((p) => p.user_id === userId)) {
    return NextResponse.json({ error: "Player already in this game" }, { status: 400 });
  }

  // Enforce max 12 total players (active or not).
  if (players.length >= 12) {
    return NextResponse.json({ error: "Game already has maximum 12 players" }, { status: 400 });
  }

  // Determine the insertion seat position.
  // insertAfterSeatPosition === null means "insert at the beginning" (seat 0).
  // Otherwise insert after the given seat position.
  const newSeatPosition =
    insertAfterSeatPosition === null || insertAfterSeatPosition === undefined
      ? 0
      : insertAfterSeatPosition + 1;

  // Shift all existing players at >= newSeatPosition up by 1 to make room.
  // Update from highest seat first to avoid unique constraint conflicts.
  const playersToShift = players
    .filter((p) => p.seat_position >= newSeatPosition)
    .sort((a, b) => b.seat_position - a.seat_position);

  for (const p of playersToShift) {
    const { error } = await supabase
      .from("game_players")
      .update({ seat_position: p.seat_position + 1 })
      .eq("id", p.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Insert the new player.
  const { data: newPlayer, error: insertError } = await supabase
    .from("game_players")
    .insert({
      game_id: gameId,
      user_id: userId,
      seat_position: newSeatPosition,
      current_level: 2,
      graduation_count: 0,
      is_active: true,
    })
    .select()
    .single();

  if (insertError || !newPlayer) {
    return NextResponse.json({ error: insertError?.message || "Failed to add player" }, { status: 500 });
  }

  return NextResponse.json({ player: newPlayer }, { status: 201 });
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
  const { userId, is_active } = body;

  if (!userId || typeof is_active !== "boolean") {
    return NextResponse.json({ error: "userId and is_active required" }, { status: 400 });
  }

  // Verify the requester is a participant.
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id, current_king_user_id, game_players(*)")
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const players = game.game_players as GamePlayer[];

  if (!players.some((p) => p.user_id === user.id)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Cannot pause the current king.
  if (!is_active && userId === game.current_king_user_id) {
    return NextResponse.json({ error: "Cannot pause the current king" }, { status: 400 });
  }

  // Cannot pause if it would leave fewer than 5 active players.
  if (!is_active) {
    const activeCount = players.filter((p) => p.is_active && p.user_id !== userId).length;
    if (activeCount < 5) {
      return NextResponse.json(
        { error: "Cannot pause: game requires at least 5 active players" },
        { status: 400 }
      );
    }
  }

  const { error: updateError } = await supabase
    .from("game_players")
    .update({ is_active })
    .eq("game_id", gameId)
    .eq("user_id", userId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
