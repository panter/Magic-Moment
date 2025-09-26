# Magic Moment - AI-Powered Postcard Creator

An innovative postcard creator application with AI features, developed for the "Magic Moment" challenge at the Zurich hackathon of [Swiss {ai} Week](https://swiss-ai-weeks.ch/) happening on 26/27 September 2025.

By accessing or using the data provided, you agree to the following terms and conditions.

## Terms and Conditions
> The data is provided solely for the purpose of participating in the hackathon event held in Zurich, Switzerland, and for developing solutions directly related to the specific challenge you have selected. You are strictly prohibited from using the Data for any other purpose, including but not limited to:
> - Commercial use.
> - Research or development outside the scope of this hackathon challenge.
> - Personal use or any other unauthorized activities.
> 
> The data is provided "as is" without any warranties, express or implied, including but not limited to, warranties of merchantability, fitness for a particular purpose, or non-infringement. The hackathon organizers do not guarantee the accuracy, completeness, or reliability of the data.
>
> Immediately following the conclusion of the hackathon event, you are obligated to permanently and securely delete all copies of the data, including any derived or processed data, from all your devices, storage media, and systems. 

## Features

- **AI-Powered Design**: Create stunning postcards with intelligent design suggestions
- **Smart Content Generation**: AI-assisted text and visual content creation
- **Personalization**: Tailored postcard experiences based on user preferences
- **Modern Stack**: Built with Next.js 15, React 19, and TurboPack for optimal performance

## Tech Stack

- **Frontend**: Next.js 15, React 19 with TypeScript
- **CMS**: Payload CMS with PostgreSQL database
- **Build Tool**: TurboPack for lightning-fast builds
- **Styling**: Tailwind CSS v4
- **Architecture**: Turborepo monorepo structure
- **Code Quality**: Biome for linting and formatting
- **File Storage**: Uploadthing for media management

## Getting Started

### Prerequisites

1. Docker and Docker Compose (for local PostgreSQL)
2. Node.js 18+ and pnpm
3. Uploadthing account (optional, for file uploads)

### Setup

1. Clone the repository and install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cd apps/www
cp .env.example .env
# Edit .env with your database credentials
```

3. Run the development server (automatically starts PostgreSQL):
```bash
pnpm dev
```

4. Access the application:
- Frontend: http://localhost:3000
- Payload Admin: http://localhost:3000/admin

### Commands

```bash
# Run development server (with PostgreSQL)
pnpm dev

# Build for production
pnpm build

# Run production server
pnpm start

# Database management
pnpm db:up      # Start PostgreSQL container
pnpm db:down    # Stop and remove PostgreSQL container
pnpm db:reset   # Reset database (removes all data)

# Code quality
pnpm lint       # Run linting
pnpm format     # Format code
```

## Project Structure

- `apps/www/` - Main Next.js application with Payload CMS
  - `/admin` - Payload CMS admin panel
  - `/api` - Payload API endpoints
- `packages/ui/` - Shared UI components library
- `packages/local-development/` - Docker Compose setup for PostgreSQL
- `data/` - Postcard Creator app usage statistics and analytics

## Payload CMS Collections

- **Users** - Authentication and user management
- **Postcards** - Main postcard entries with AI generation tracking
- **Templates** - Reusable postcard templates by category
- **Media** - Image uploads and media management

## Source of Data
The data of this respository has been provided by [Swiss Post](https://www.post.ch/) submitting the challenge


