# D&D-Style Interactive Game Project Structure

```
DD/
├── README.md                      # Project documentation
├── package.json                   # Project dependencies and scripts
├── package-lock.json              # Dependency lock file
├── tsconfig.json                  # TypeScript configuration
├── next.config.ts                 # Next.js configuration
├── next-env.d.ts                  # Next.js TypeScript declarations
├── postcss.config.mjs             # PostCSS configuration
├── eslint.config.mjs              # ESLint configuration
├── .env.local                     # Environment variables (git-ignored)
├── .env.local.example             # Example environment variables
├── .gitignore                     # Git ignore file
├── design.md                      # Design documentation
├── supabase/                      # Supabase configuration and migrations
│   └── migrations/                # Database migrations
├── public/                        # Static assets
│   ├── images/
│   │   └── game/                  # Game-related images
├── src/                           # Application source code
│   ├── app/                       # Next.js App Router structure
│   │   ├── layout.tsx             # Root layout component
│   │   ├── page.tsx               # Landing page
│   │   ├── globals.css            # Global CSS
│   │   ├── favicon.ico            # Site favicon
│   │   ├── error/                 # Error handling
│   │   │   └── page.tsx
│   │   ├── auth/                  # Auth routes
│   │   │   └── page.tsx
│   │   ├── auth-status/           # Auth status component
│   │   │   └── page.tsx
│   │   ├── login/                 # Login page
│   │   │   └── page.tsx
│   │   ├── register/              # Registration page
│   │   │   └── page.tsx
│   │   ├── game/                  # Main game pages
│   │   │   ├── page.tsx           # Template selection
│   │   │   ├── create/            # Character creation
│   │   │   │   └── page.tsx
│   │   │   ├── play/              # Active gameplay
│   │   │   │   ├── page.tsx
│   │   │   │   └── [sessionId]/
│   │   │   │       └── page.tsx
│   │   │   └── history/           # Game history
│   │   │       └── page.tsx
│   │   └── api/                   # API routes
│   │       ├── auth/              # Auth related endpoints
│   │       │   └── route.ts
│   │       ├── ai/                # AI integration endpoints
│   │       │   └── route.ts
│   │       └── game/              # Game related endpoints (to be implemented)
│   │           ├── session/
│   │           │   └── route.ts
│   │           ├── action/
│   │           │   └── route.ts
│   │           └── save/
│   │               └── route.ts
│   ├── components/                # UI components
│   │   ├── ui/                    # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Dialog.tsx
│   │   ├── auth/                  # Auth components
│   │   │   └── AuthCheck.tsx      # Authentication check component
│   │   └── game/                  # Game-specific components
│   │       ├── TemplateCard.tsx   # Template selection card
│   │       ├── CharacterCreator.tsx # Character creation form
│   │       ├── AttributeDisplay.tsx # Character attributes display
│   │       ├── GameInterface.tsx  # Main game interface
│   │       ├── DialogueBox.tsx    # AI narrative display
│   │       ├── ActionSelector.tsx # Action selection interface
│   │       ├── DiceRoller.tsx     # Dice rolling visualization
│   │       └── RelationshipBar.tsx # NPC relationship display
│   ├── lib/                       # Utility functions and helpers
│   │   ├── utils.ts               # General utilities
│   │   ├── supabase/              # Supabase client
│   │   │   └── client.ts
│   │   ├── openai/                # OpenAI client
│   │   │   └── client.ts
│   │   └── game/                  # Game logic
│   │       ├── dice.ts            # Dice mechanics
│   │       ├── state-manager.ts   # Game state management
│   │       ├── prompt-builder.ts  # AI prompt construction
│   │       └── template-loader.ts # Template loading and validation
│   ├── utils/                     # Additional utilities
│   │   └── supabase/              # Supabase utilities
│   ├── middleware.ts              # Next.js middleware for auth
│   ├── templates/                 # Game templates (JSON format)
│   │   ├── helicopter-parent.json # "Asian Helicopter Parenting" scenario
│   │   ├── white-house.json       # "White House Chaos" scenario
│   │   └── pirate-adventure.json  # "Pirate Adventure" scenario
│   ├── types/                     # TypeScript type definitions
│   │   ├── auth.ts                # Auth-related types
│   │   ├── game.ts                # Game data structures
│   │   ├── template.ts            # Game template interfaces
│   │   └── supabase.ts            # Database schema types
│   └── context/                   # React Context providers
│       ├── AuthContext.tsx        # Authentication context (large file ~30KB)
│       └── GameContext.tsx        # Game state context (large file ~15KB)
```

## Key Directory Explanations

### `/src`
Main source code directory containing the entire application.

### `/src/app`
Next.js App Router structure containing all pages and API routes.

### `/src/components`
React components organized by functionality:
- `ui/`: Reusable UI components
- `auth/`: Authentication-related components
- `game/`: Game-specific interface components

### `/src/lib`
Utility functions and service integrations:
- `supabase/`: Database client and operations
- `openai/`: AI integration
- `game/`: Core game mechanics and template handling

### `/src/utils`
Additional utility functions and service integrations.

### `/src/templates`
JSON-formatted game scenario templates containing specific game scenario templates as JSON files.

### `/src/context`
React Context providers for global state management.
- Note: The context files are quite large (AuthContext.tsx ~30KB, GameContext.tsx ~15KB) and may benefit from refactoring into smaller modules.

### `/src/types`
TypeScript type definitions for the application, including template interfaces that mirror the JSON schema.

### `/supabase`
Supabase configuration and database migrations, located at the root of the project.

## Improvement Recommendations

### Context Files Refactoring
The context files (particularly AuthContext at ~30KB) are extremely large, which can lead to:
- Difficulty in maintenance and understanding
- Potential performance issues with large component rerenders
- Challenges in testing and debugging

Consider breaking down these files into smaller modules:
- Split AuthContext into separate files for authentication, user management, and session handling
- Extract utility functions into separate files
- Consider using the React Query or SWR libraries for data fetching and state management

### Type Organization
As the application grows, consider organizing types into more specific directories:
- `/src/types/auth/` - Authentication-related types
- `/src/types/game/` - Game-related types
- `/src/types/api/` - API request/response types

### Testing Structure
Add a structured testing framework:
```
├── __tests__/                     # Test files
│   ├── components/                # Component tests
│   ├── utils/                     # Utility function tests
│   ├── context/                   # Context tests
│   └── api/                       # API route tests
```

### Documentation
Consider adding more detailed documentation:
```
├── docs/                          # Documentation
│   ├── api/                       # API documentation
│   ├── game-mechanics/            # Game mechanics documentation
│   └── deployment/                # Deployment guides
``` 