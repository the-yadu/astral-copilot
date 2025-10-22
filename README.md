# Digital Lessons - Next.js Educational Content Generator

A Next.js application that generates interactive educational content using AI. Users can create lesson outlines and the system generates React components that can be dynamically loaded and rendered.

## Features

- **AI-Powered Content Generation**: Uses OpenAI to generate interactive lesson components
- **Dynamic Component Loading**: Renders AI-generated React components in real-time
- **Supabase Integration**: Database and file storage for lessons
- **Next.js 15**: Modern React framework with App Router
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase project
- OpenAI API key

### Environment Variables

Create a `.env.local` file with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

### Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or 3001 if 3000 is busy) to see the application.

### Database Setup

The application requires the following Supabase setup:

1. **Lessons Table**: Stores lesson metadata and status
2. **Storage Bucket**: `lesson-files` for storing generated TSX components
3. **RLS Policies**: Public access for lesson creation and viewing

## Architecture

- **App Router**: Next.js 15 app directory structure
- **API Routes**: `/api/generate-lesson` handles AI content generation
- **Dynamic Routing**: `/lessons/[id]` for individual lesson viewing
- **Client Components**: Interactive UI with real-time updates

## Key Components

- `src/app/page.tsx`: Main lesson creation and listing page
- `src/app/lessons/[id]/page.tsx`: Individual lesson viewer with dynamic component loading
- `src/app/api/generate-lesson/route.ts`: AI content generation API
- `src/lib/supabase.ts`: Supabase client configuration
- `src/lib/database.types.ts`: TypeScript types for database schema

## Deployment

Deploy on Vercel with environment variables configured:

```bash
npm run build
```

## Development

The application converts lesson outlines into interactive React components using:
1. OpenAI for content generation
2. Dynamic imports for component loading
3. Supabase for storage and real-time updates
