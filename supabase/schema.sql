-- User profiles (display names for game).
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games.
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  current_king_user_id UUID REFERENCES auth.users(id), -- NULL until first King selected.
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game players (links users to games with seating + scores).
CREATE TABLE game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  seat_position INTEGER NOT NULL CHECK (seat_position >= 0), -- 0-indexed counter-clockwise.
  current_level INTEGER NOT NULL DEFAULT 2 CHECK (current_level >= 2 AND current_level <= 14), -- 2-14 (14=A).
  graduation_count INTEGER NOT NULL DEFAULT 0 CHECK (graduation_count >= 0),
  UNIQUE(game_id, user_id),
  UNIQUE(game_id, seat_position)
);

-- Rounds (history) - minimal storage, compute derived values.
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL CHECK (round_number >= 1),
  king_user_id UUID NOT NULL REFERENCES auth.users(id),
  town_points INTEGER NOT NULL CHECK (town_points >= 0), -- Only store this, compute King's Side win.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  UNIQUE(game_id, round_number)
);

-- Round participants (who was on King's Side) - includes game_id for RLS performance.
CREATE TABLE round_kings_side (
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  PRIMARY KEY (round_id, user_id)
);

-- Indexes for performance.
CREATE INDEX idx_games_created_by ON games(created_by);
CREATE INDEX idx_game_players_game_id ON game_players(game_id);
CREATE INDEX idx_game_players_user_id ON game_players(user_id);
CREATE INDEX idx_rounds_game_id ON rounds(game_id);
CREATE INDEX idx_round_kings_side_game_id ON round_kings_side(game_id);

-- Enable Row Level Security.
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_kings_side ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles.
-- Users can read all profiles (for player selection).
CREATE POLICY "Users can read all profiles"
  ON user_profiles FOR SELECT
  USING (true);

-- Users can insert their own profile.
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile.
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for games.
-- Participants can read their games.
CREATE POLICY "Participants can read their games"
  ON games FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = games.id
        AND game_players.user_id = auth.uid()
    )
  );

-- Users can create games.
CREATE POLICY "Users can create games"
  ON games FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Participants can update their games.
CREATE POLICY "Participants can update their games"
  ON games FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = games.id
        AND game_players.user_id = auth.uid()
    )
  );

-- RLS Policies for game_players.
-- Participants can read players in their games.
CREATE POLICY "Participants can read players in their games"
  ON game_players FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_players gp
      WHERE gp.game_id = game_players.game_id
        AND gp.user_id = auth.uid()
    )
  );

-- Users can insert game_players when creating a game.
CREATE POLICY "Users can insert game_players"
  ON game_players FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = game_players.game_id
        AND games.created_by = auth.uid()
    )
  );

-- Participants can update game_players in their games.
CREATE POLICY "Participants can update game_players"
  ON game_players FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM game_players gp
      WHERE gp.game_id = game_players.game_id
        AND gp.user_id = auth.uid()
    )
  );

-- RLS Policies for rounds.
-- Participants can read rounds in their games.
CREATE POLICY "Participants can read rounds"
  ON rounds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = rounds.game_id
        AND game_players.user_id = auth.uid()
    )
  );

-- Participants can insert rounds in their games.
CREATE POLICY "Participants can insert rounds"
  ON rounds FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = rounds.game_id
        AND game_players.user_id = auth.uid()
    )
  );

-- RLS Policies for round_kings_side.
-- Participants can read round_kings_side in their games.
CREATE POLICY "Participants can read round_kings_side"
  ON round_kings_side FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = round_kings_side.game_id
        AND game_players.user_id = auth.uid()
    )
  );

-- Participants can insert round_kings_side in their games.
CREATE POLICY "Participants can insert round_kings_side"
  ON round_kings_side FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.game_id = round_kings_side.game_id
        AND game_players.user_id = auth.uid()
    )
  );
