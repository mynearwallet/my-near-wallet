# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NEAR Wallet (My NEAR Wallet) is a browser-based web wallet for NEAR Protocol accounts. It stores account keys in localStorage and supports hardware wallets (Ledger), seed phrase recovery, and two-factor authentication.

## Commands

### Development
```bash
# Install dependencies and start dev server (testnet)
yarn dev

# Start dev server for mainnet
yarn dev:mainnet

# Run linting
yarn lint

# Run unit tests (frontend)
yarn test

# Run a single test file
cd packages/frontend && yarn test path/to/file.test.js

# Type checking
cd packages/frontend && yarn check
```

### E2E Tests
```bash
# Run all e2e tests
yarn test:e2e

# Run e2e tests with UI
cd packages/e2e-tests && yarn e2e:ui

# Run specific e2e test suite
cd packages/e2e-tests && yarn e2e:swap
```

### Build
```bash
yarn pre-build  # Clean dist and cache
yarn build      # Production build with Sentry
```

## Architecture

### Monorepo Structure
- `packages/frontend` - Main React/Redux wallet application (Parcel bundler)
- `packages/e2e-tests` - Playwright end-to-end tests
- `packages/guestbook` - Demo app

### Frontend Key Directories
- `src/app/` - Main App component with routing (App.js defines all routes)
- `src/redux/` - Redux state management
  - `slices/` - Redux Toolkit slices (account, staking, swap, tokens, etc.)
  - `actions/` - Action creators
  - `reducers/` - Legacy reducers
- `src/services/` - External service integrations
  - `coreIndexer/` - Blockchain indexer adapters (FastNear, Mintbase, Nearblocks)
  - `tokenExchange/` - DEX integration (Ref Finance)
  - `metapool/` - Liquid staking
- `src/components/` - React components organized by feature
- `src/utils/wallet.ts` - Core wallet class handling keys, accounts, signing
- `src/config/` - Environment-specific configuration

### State Management
Uses Redux Toolkit with slices. Key slices:
- `account` - Current account state and actions
- `staking` - Validator staking
- `tokens` - FT balances
- `swap` - Token swap state
- `ledger` - Hardware wallet connection

### Key Integration Points
- `near-api-js` - NEAR Protocol SDK
- `near-ledger-js` - Ledger hardware wallet
- Indexers: FastNear, Mintbase, Nearblocks for account/token data
- Ref Finance for token swaps

### Environment Configuration
Set via `NEAR_WALLET_ENV`:
- `development` / `testnet` - NEAR testnet
- `mainnet` - NEAR mainnet
- `testnet_STAGING` / `mainnet_STAGING` - Staging environments

## Code Conventions

- Use `query-string` package instead of `URLSearchParams` (enforced by ESLint)
- Use selectors for Redux state access in `useSelector`
- Dynamic imports are disabled (`es/no-dynamic-import`)
- Single quotes, semicolons required
- Environment variables only in `config/configFromEnvironment.ts`

Using Gemini CLI for large codebase analysis

When a task involves many files or directories and might overflow your context window, prefer using the local gemini CLI and then summarize its output. Use gemini -p with the @ path syntax to let Gemini read the files while Claude focuses on planning and editing.

File and directory syntax

Paths are relative to the directory where you run the gemini command, and @ tells Gemini CLI which files or folders to load into context.

Examples

Single file

gemini -p "@src/main.py Describe what this file does and how it is structured."

Multiple files

gemini -p "@package.json @src/index.js Analyze the dependencies and how they are used in the codebase."

One directory

gemini -p "@src/ Summarize the architecture, main modules, and data flow of this codebase."

Several directories

gemini -p "@src/ @tests/ Explain how the test suite covers the source code and where the gaps are."

Whole project tree

gemini -p "@./ Give me a high-level overview of this project: tech stack, structure, and main responsibilities of each area."

Using all tracked files

gemini --all_files -p "Analyze the project layout, build system, and external dependencies."

Implementation checks

Use Gemini CLI to confirm whether specific features or patterns exist across the repo:

Feature present?

gemini -p "@src/ @lib/ Is dark mode implemented? List the relevant files and functions."

Authentication

gemini -p "@src/ @middleware/ How is authentication implemented (e.g. JWT/session)? List auth-related endpoints and middleware."

WebSocket hooks

gemini -p "@src/ Do we have React hooks or utilities that manage WebSocket connections? Show them with file paths."

Error handling

gemini -p "@src/ @api/ Is error handling consistent for API endpoints? Show representative try/catch or error-handling logic."

Rate limiting

gemini -p "@backend/ @middleware/ Is there any rate limiting in place for the API? Describe the implementation."

Caching

gemini -p "@src/ @lib/ @services/ Is Redis (or any cache layer) used? List cache-related functions and how they are used."

Security measures

gemini -p "@src/ @api/ How are inputs sanitized to avoid SQL injection and similar attacks?"

Tests for a feature

gemini -p "@src/payment/ @tests/ How well is the payment module tested? List the main test cases."

When Claude should call Gemini

Prefer calling gemini -p via the bash tool when:

You need to reason about an entire codebase or large folders.

Comparing or scanning many big files at once.

Investigating project-wide patterns, architecture, or cross-cutting concerns.

Total relevant files are likely > 100 KB of text.

Verifying whether specific features, patterns, or security practices exist.

Searching for coding patterns across many files.

Important notes

Treat Gemini CLI output as an external report: read it, then answer in your own words.

@ paths are always relative to the current working directory where gemini is executed.

The CLI injects file contents directly into Gemini’s context, so Claude does not spend its own context window on those files.

For read-only analysis you do not need any destructive flags.

Be explicit in the -p prompt about what you want Gemini to look for; this produces more accurate results.