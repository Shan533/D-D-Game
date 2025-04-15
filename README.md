# D&D-Style Interactive Game

An AI-powered interactive storytelling game with triple dice mechanics, character customization, and dynamic narrative progression.

## Key Features

- AI-driven narrative that adapts to player choices
- Triple dice system with special events for matching dice
- Stage-based gameplay with goals and progression
- Character customization affecting gameplay outcomes
- Multiple scenario templates (idol competition, white house advisor, etc.)
- Story conclusion system with multiple ending paths

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase for authentication and data storage
- **AI**: OpenAI API for dynamic storytelling

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account
- OpenAI API key

### Quick Start

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/dd-game.git
   cd dd-game
   ```

2. Install dependencies and set up environment:
   ```
   npm install
   cp .env.local.example .env.local   # Edit with your API keys
   ```

3. Start development server:
   ```
   npm run dev
   ```

4. Open [http://localhost:8000](http://localhost:8000) to play

## Game Mechanics

### Triple Dice System
- Three dice (1-6) rolled simultaneously
- Matching dice trigger special events
- Non-matching dice values are summed (3-18)
- Attribute modifiers affect success thresholds

### Stage Progression
- Multiple game stages with unique goals
- Character attributes influence goal completion
- Stage transitions mark story progression

### Story Conclusion
- Natural completion of final stage
- Extended gameplay endings (30+ turns)
- Player-requested endings via keywords

## Documentation

See the [docs](/docs) directory for detailed information:

- [Design Document](/docs/design.md) - Architecture and implementation details
- [File Structure](/docs/file_structure.md) - Codebase organization
- [Database Setup](/docs/db-setup.md) - Supabase configuration
- [Template Structure](/src/templates/template-structure.md) - Documentation for creating game templates

## License

MIT
