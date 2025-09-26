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

This is a Next.js 15 application using:
- **React 19.1** with TypeScript
- **TurboPack** for faster builds and HMR
- **Tailwind CSS v4** for styling (using PostCSS)
- **Biome** for linting and formatting (replaces ESLint/Prettier)
- **App Router** architecture in `src/app/`

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