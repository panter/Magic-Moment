# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `pnpm dev` - Run development server with Next.js TurboPack
- `pnpm build` - Build production bundle with TurboPack
- `pnpm start` - Start production server

### Code Quality
- `pnpm lint` - Run Biome linter to check code quality
- `pnpm format` - Format code with Biome

## Architecture

This is a Turborepo monorepo with a Next.js 15 application using:
- **React 19.1** with TypeScript
- **TurboPack** for faster builds and HMR
- **Tailwind CSS v4** for styling (using PostCSS)
- **Biome** for linting and formatting (replaces ESLint/Prettier)
- **App Router** architecture

### Monorepo Structure

- **`packages/ui/`** (`@repo/ui`): Shared UI components library
  - Place reusable React components here
  - Components that can be used across different apps
  - Design system components (buttons, modals, cards, etc.)

- **`apps/www/`** (`@repo/www`): Main Next.js application
  - Features and screens specific to the application
  - Business logic and page components
  - API routes and app-specific functionality
  - Located in `apps/www/src/app/` using App Router

### Where Things Go

- **Shared UI Components**: `packages/ui/src/`
  - Examples: Button, Card, Modal, Form components
  - Generic, reusable components without business logic

- **Application Features**: `apps/www/src/`
  - Page components in `apps/www/src/app/`
  - Feature-specific components in `apps/www/src/components/`
  - Utilities and hooks in `apps/www/src/lib/`
  - API routes in `apps/www/src/app/api/`

## Project Context

This repository is for the "Magic Moment" challenge at the Zurich hackathon (Swiss {ai} Week, September 26-27, 2025). The data in the `data/` directory includes:
- Postcard Creator app usage statistics
- Session and device analytics from July 2025
- Data provided by Swiss Post

## Biome Configuration

The project uses Biome with:
- Indent: 2 spaces
- Next.js and React recommended rules enabled
- Auto-organize imports on save
- Files outside `src/` and standard directories are ignored