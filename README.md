# UIGen

AI-powered React component generator with live preview.

## Prerequisites

- Node.js 18+
- npm

## Setup

1. **Optional** Edit `.env` and add your AI provider API key:

```bash
# Using OpenRouter (recommended - official @openrouter/ai-sdk-provider)
PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=anthropic/claude-sonnet-4.5

# OR using Anthropic directly (legacy)
PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

The project will run without an API key using a mock provider that generates static components.

Get your API keys:
- **OpenRouter**: https://openrouter.ai (recommended, access to multiple AI models)
- **Anthropic**: https://console.anthropic.com (direct Claude API access)

2. Install dependencies and initialize database

```bash
npm run setup
```

This command will:

- Install all dependencies
- Generate Prisma client
- Run database migrations

## Running the Application

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Sign up or continue as anonymous user
2. Describe the React component you want to create in the chat
3. View generated components in real-time preview
4. Switch to Code view to see and edit the generated files
5. Continue iterating with the AI to refine your components

## Features

- AI-powered component generation using Claude
- Live preview with hot reload
- Virtual file system (no files written to disk)
- Syntax highlighting and code editor
- Component persistence for registered users
- Export generated code

## Tech Stack

- Next.js 15 with App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Prisma with SQLite
- Anthropic Claude AI (Haiku 4.5)
- Vercel AI SDK 5.0

## Development Notes

This project uses `.npmrc` with `legacy-peer-deps=true` to handle peer dependency conflicts between AI SDK 5 and legacy conversion utilities. This is normal and expected.
