# D&D-Style Interactive Game

A digital D&D-style interactive storytelling game with AI-powered narrative, dice rolling mechanics, and character customization.

## Features

- AI-driven storytelling that responds to player choices
- D&D-style dice rolling mechanics
- Character customization with attributes that impact gameplay
- Multiple game templates with unique scenarios
- Persistent game state with save/load functionality
- Relationship system with NPCs

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase for authentication and data storage
- **AI**: OpenAI API for dynamic storytelling
- **Styling**: Custom UI components

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/dd-game.git
   cd dd-game
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Copy the environment variables template and fill in your values:
   ```
   cp .env.local.example .env.local
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the game.

## Authentication Implementation

The game uses Supabase for authentication with server-side JWT handling:

- **Server Components**: Authentication in server components is handled through `@/utils/supabase/server.ts`
- **Client Components**: Client-side authentication is handled through `@/utils/supabase/client.ts`
- **Middleware**: Session refresh and protection is handled through `@/utils/supabase/middleware.ts`
- **Protected Routes**: Game routes are protected with middleware redirects

Following the latest Next.js 15 patterns, we use:
- Server Actions for login/logout/signup flows
- Cookies for session persistence
- JWT validation for secure authentication

## Game Mechanics

The game uses two main mechanics:

1. **Text-based Interaction**: Players type their actions and the AI responds with narrative.
2. **Dice Rolling**: For skill checks, the game uses D20 dice rolling with modifiers based on character attributes.

### Dice System

- Standard D20 dice mechanics
- Critical success on natural 20
- Critical failure on natural 1
- Attribute modifiers affect roll results
- Success/failure determined against difficulty class (DC)

### Character Attributes

Characters have attributes that affect gameplay:
- Each attribute has a value (5-15 typically)
- Modifiers are calculated as (attribute / 5, rounded down)
- Attributes are used in skill checks and affect outcomes

## Project Structure

- `/src/components`: UI components
- `/src/context`: React context providers for auth and game state
- `/src/lib`: Utility functions and services
- `/src/types`: TypeScript type definitions
- `/src/app`: Next.js App Router pages
- `/src/utils`: Core utilities including Supabase client configuration

## License

This project is licensed under the MIT License - see the LICENSE file for details.
