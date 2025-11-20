# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. It uses Claude AI (via Anthropic SDK) to generate React components based on user prompts. The application features a virtual file system (no files written to disk), live preview with hot reload, and component persistence for registered users.

## Tech Stack

- **Framework**: Next.js 15 (App Router) with Turbopack
- **UI**: React 19, TypeScript, Tailwind CSS v4
- **Database**: Prisma with SQLite
- **AI**: Anthropic Claude AI (Haiku 4.5) via Vercel AI SDK
- **Testing**: Vitest with React Testing Library

## Development Commands

### Setup
```bash
npm run setup  # Install deps, generate Prisma client, run migrations
```

### Development
```bash
npm run dev              # Start dev server with Turbopack
npm run dev:daemon       # Start dev server in background (logs to logs.txt)
```

### Building & Linting
```bash
npm run build            # Build production bundle
npm run lint             # Run ESLint
```

### Testing
```bash
npm test                 # Run all tests with Vitest
npm test -- path/to/file.test.ts  # Run a single test file
```

### Database
```bash
npx prisma generate      # Generate Prisma client (outputs to src/generated/prisma)
npx prisma migrate dev   # Create and apply migrations
npm run db:reset         # Reset database (force)
npx prisma studio        # Open Prisma Studio GUI
```

## Architecture

### Virtual File System
The core of UIGen is the `VirtualFileSystem` class (`src/lib/file-system.ts`) which implements an in-memory file system. It stores files in a Map structure and provides CRUD operations (create, read, update, delete, rename). The file system is serialized/deserialized to/from JSON for persistence in the database.

**Key Methods:**
- `createFile(path, content)` - Creates file with auto-created parent directories
- `updateFile(path, content)` - Updates file content
- `deleteFile(path)` - Recursively deletes files/directories
- `rename(oldPath, newPath)` - Moves/renames files with path updates
- `serialize()` / `deserialize()` - Converts to/from JSON for storage
- `viewFile(path, viewRange?)` - Returns file content with line numbers (used by AI tools)

### AI Integration
The chat API route (`src/app/api/chat/route.ts`) orchestrates AI-powered component generation:

1. **System Prompt**: Injected from `src/lib/prompts/generation.tsx` with prompt caching enabled
2. **AI Tools**: Two tools provided to the AI model:
   - `str_replace_editor` - View, create, edit files (str_replace, insert operations)
   - `file_manager` - Rename/delete files and directories
3. **Mock Provider**: When `ANTHROPIC_API_KEY` is not set, uses `MockLanguageModel` that generates static component code (Counter, Form, or Card)
4. **Persistence**: On completion, saves messages and file system state to database (authenticated users only)

### Data Flow
1. User sends chat message → `POST /api/chat`
2. VirtualFileSystem reconstructed from serialized data
3. AI model receives tools and generates/edits components
4. Tools execute operations on VirtualFileSystem
5. Responses streamed to client
6. On finish, state persisted to Prisma database

### Database Schema
- **User**: id, email, password (bcrypt hashed), timestamps
- **Project**: id, name, userId (nullable for anonymous), messages (JSON), data (JSON serialized VirtualFileSystem), timestamps

Projects support anonymous users (userId can be null). The `anon-work-tracker.ts` handles tracking anonymous work.

### Authentication
JWT-based auth (`src/lib/auth.ts`) using `jose` library. Session tokens stored in cookies. Middleware (`src/middleware.ts`) protects project routes.

### Component Preview
The preview component (`src/components/preview/`) uses Babel standalone to transpile JSX at runtime and renders components in an iframe-like environment. The transformer (`src/lib/transform/jsx-transformer.ts`) handles JSX to JS conversion.

### UI Components
Located in `src/components/ui/` - shadcn/ui components built with Radix UI primitives and styled with Tailwind CSS.

## Important Implementation Notes

### File System Conventions
- All paths start with `/` (root)
- Every project must have a `/App.jsx` file as the entry point
- Import alias `@/` is used for all local imports (e.g., `import Counter from '@/components/Counter'`)
- No HTML files are created - App.jsx is the entry point

### AI Prompt Guidelines
The generation prompt (`src/lib/prompts/generation.tsx`) enforces:
- Brief responses (no unnecessary summaries)
- Tailwind CSS for styling (no inline styles)
- Virtual FS at root `/`
- All non-library imports use `@/` alias

### Testing
Tests are located in `__tests__` directories next to source files. The `src/lib/__tests__/` directory contains tests for core utilities. Use Vitest with jsdom environment for React component testing.

### Prisma Client Location
**Critical**: The Prisma client is generated to `src/generated/prisma` (not the default `node_modules/@prisma/client`). This is configured in `prisma/schema.prisma` with `output = "../src/generated/prisma"`.

### Environment Variables
- `ANTHROPIC_API_KEY` - Optional. If not set, the mock provider generates static components.
- Database URL is hardcoded in schema as `file:./dev.db` (SQLite)

## Common Patterns

### Adding New AI Tools
1. Create tool in `src/lib/tools/` following the pattern in `str-replace.ts` or `file-manager.ts`
2. Use Zod for parameter validation
3. Register tool in `src/app/api/chat/route.ts` tools object
4. Tool must operate on the VirtualFileSystem instance

### Creating New Actions
Server actions in `src/actions/` use `"use server"` directive and interact with Prisma. Export from `src/actions/index.ts` for cleaner imports.

### File System Operations
Always use VirtualFileSystem methods rather than Node.js fs operations. The file system is entirely in-memory and persisted as JSON in the database.
