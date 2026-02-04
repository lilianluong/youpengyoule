# 有朋友了 (You Peng You Le)

PWA for tracking scores in 找朋友 (Zhao Pengyou / Finding Friends) card game.

## Features

✅ **User Authentication** - Magic link (email OTP) via Supabase
✅ **Game Management** - Create games with 5-12 players
✅ **Counter-clockwise Seating** - Configurable player order
✅ **Score Tracking** - Levels (2-14/Ace) and graduations
✅ **Round Entry** - Select King's Side, enter Town points, preview outcome
✅ **Round History** - View all past rounds with winners
✅ **Deck Requirements** - Auto-calculated based on player count (from Pagat)
✅ **King Rotation** - Automatic next King selection
✅ **PWA Support** - Install on mobile devices
✅ **Responsive Design** - Warm terracotta/cream aesthetic

## Setup

### 1. Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Create a new project
3. Save your project URL and anon key

### 2. Set Up Database

1. Go to SQL Editor in Supabase dashboard
2. Run the entire contents of `supabase/schema.sql`
3. Verify all tables are created with RLS policies

### 3. Configure Environment

```bash
# Copy example env file
cp .env.local.example .env.local

# Edit .env.local and add your credentials:
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Install and Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

Visit http://localhost:3000 and log in with your email.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Tech Stack

- **Framework**: Next.js 16 + TypeScript
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS v4
- **PWA**: next-pwa
- **Fonts**: DM Serif Display (Google Fonts)

## Game Rules

### Players & Teams
- **Players**: 5-12 per game (all Pagat configurations supported)
- **Teams**: King's Side (attackers) vs Town (defenders)
- **Seating**: Counter-clockwise (0-indexed)

### Scoring
- **Town Points Per Deck**: 100 total
- **King's Side Wins**: Town gets < 40 points/deck
- **Town Wins**: Town gets ≥ 60 points/deck
- **Tie (40-60)**: Counts as Town win

### Level Advancement
- **Levels**: 2 → 3 → 4 → ... → 14 (Ace)
- **Base Advancement**: Winners advance 1 level
- **Bonus Levels**: Every 20 points/deck above threshold = +1 level
- **Graduation**: After level 14 (Ace), return to level 2, graduation count +1

### King Rotation
- First winner counter-clockwise from current King becomes next King
- King is automatically on King's Side

## Project Structure

```
app/
├── api/
│   ├── auth/callback/      # Magic link callback
│   ├── users/              # List users
│   └── games/
│       ├── route.ts        # List/create games
│       └── [gameId]/
│           ├── route.ts    # Get/update game
│           └── rounds/     # Round history & creation
├── games/
│   ├── page.tsx           # Games list
│   ├── new/               # Create game
│   └── [gameId]/
│       ├── page.tsx       # Game detail & scoreboard
│       └── round/         # Enter round result
└── login/                 # Authentication

components/
├── Scoreboard.tsx         # Player levels display
├── DeckRequirements.tsx   # Deck configuration
└── RoundHistory.tsx       # Past rounds

lib/
├── game-logic.ts          # Scoring & king rotation
├── deck-requirements.ts   # Deck configs by player count
└── supabase/             # Supabase clients

supabase/
└── schema.sql            # Database schema with RLS
```

## Database Schema

- `user_profiles` - Display names and emails
- `games` - Game metadata and current king
- `game_players` - Player seating, levels, graduations
- `rounds` - Round history (king, town points)
- `round_kings_side` - King's Side participants per round

Row Level Security (RLS) ensures participants can only see their own games.

## Development Notes

### Testing Solo

Since RLS restricts access to game participants, you can:
1. Create fake user profiles directly in Supabase for testing
2. Add yourself and fake users to test games
3. All game interactions will work as you're a participant

### Icon Placeholders

Replace `public/icon-192.png` and `public/icon-512.png` with actual app icons.

## License

MIT
