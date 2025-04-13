#!/bin/bash

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Apply migrations
echo "Applying Supabase migrations..."
supabase migration up

# If there's an issue with the CLI, provide manual instructions
if [ $? -ne 0 ]; then
    echo "===================================================="
    echo "Failed to apply migrations automatically."
    echo ""
    echo "Please apply the migrations manually in the Supabase dashboard:"
    echo "1. Go to https://supabase.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to SQL Editor"
    echo "4. Create a new query"
    echo "5. Copy and paste the contents of supabase/migrations/20250413000000_create_game_tables.sql"
    echo "6. Run the query"
    echo "===================================================="
    
    # Print the SQL directly for easy copying
    echo ""
    echo "Here's the SQL to paste:"
    echo ""
    cat supabase/migrations/20250413000000_create_game_tables.sql
fi

echo ""
echo "Migration process completed!" 