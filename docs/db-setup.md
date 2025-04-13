# Database Setup Guide

This document explains how to set up the necessary database tables for the D&D-style interactive game.

## Required Tables

The application requires the following tables in your Supabase database:

1. `users` - Stores user information
2. `game_sessions` - Stores game session data
3. `game_history` - Stores game history records
4. `achievements` - Stores user achievements

## Setting Up Tables

You can set up these tables using one of the following methods:

### Method 1: Using the Supabase CLI

1. Install the Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Run the migration script:
   ```bash
   ./apply-migrations.sh
   ```

### Method 2: Using the Supabase Dashboard

1. Go to the [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to the SQL Editor
4. Create a new query
5. Copy and paste the following SQL:

```sql
-- Create game_sessions table
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  template_id TEXT NOT NULL,
  game_state JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game_history table
CREATE TABLE IF NOT EXISTS public.game_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES game_sessions(id) NOT NULL,
  turn_number INTEGER NOT NULL,
  action TEXT NOT NULL,
  result TEXT NOT NULL,
  state_changes JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  achievement_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id, template_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON public.game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_history_session_id ON public.game_history(session_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.achievements(user_id);
```

6. Run the query

## Troubleshooting

If you encounter a 404 error when trying to create a game session (`POST https://your-project.supabase.co/rest/v1/game_sessions?select=* 404 (Not Found)`), it means the `game_sessions` table doesn't exist in your Supabase database.

Follow the steps above to create the required tables and try again.

## Database Schema

The database schema is designed based on the project requirements outlined in the design document:

- `users` - Stores basic user information and authentication details
- `game_sessions` - Stores each game session with JSON game state
- `game_history` - Records player actions and results for each turn
- `achievements` - Tracks user achievements 