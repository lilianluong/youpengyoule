# 有朋友了 (You Peng You Le)

PWA for tracking scores in 找朋友 (Zhao Pengyou / Finding Friends) card game.

## Setup

1. Create a Supabase project at https://supabase.com/dashboard
2. Copy `.env.local.example` to `.env.local` and add your Supabase credentials
3. Run the database schema from `supabase/schema.sql` in the Supabase SQL editor
4. Install dependencies: `npm install`
5. Run development server: `npm run dev`

## Tech Stack

- Next.js 16 + TypeScript
- Supabase (auth + database)
- Tailwind CSS v4
- next-pwa

## Game Rules

- **Players**: 5-12 per game
- **Teams**: King's Side (attackers) vs Town (defenders)
- **Seating**: Counter-clockwise
- **Scoring**: Based on Town points per deck (40/60 thresholds)
- **Level Advancement**: 2 through 14 (Ace)
