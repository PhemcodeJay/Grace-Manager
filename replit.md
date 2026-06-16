# Grace Manager - Church Management System

## Overview

Grace Manager is a full-stack Church Management System (CMS) built for non-profit religious organizations. It provides comprehensive tools for managing church membership, events, donations, ministries, welfare cases, and evangelism outreach. The application features a modern React frontend with a robust Express.js backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state caching and synchronization
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theming (spiritual blue/gold color scheme)
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful endpoints with Zod schema validation
- **Authentication**: Passport.js with local strategy, session-based auth using express-session
- **Password Security**: Scrypt hashing with timing-safe comparison

### Data Storage
- **Database**: PostgreSQL via Neon serverless driver
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Session Store**: PostgreSQL-backed sessions via connect-pg-simple
- **Schema Location**: Shared schema in `/shared/schema.ts` for frontend/backend type sharing

### Project Structure
```
├── client/           # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks for data fetching
│   │   ├── pages/        # Route-level page components
│   │   └── lib/          # Utilities and query client
├── server/           # Express backend
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Database access layer
│   └── db.ts         # Database connection
├── shared/           # Shared types and schemas
│   ├── schema.ts     # Drizzle database schema
│   └── routes.ts     # API contract definitions with Zod
└── migrations/       # Drizzle database migrations
```

### Core Entities
- **Users**: Role-based access (admin, pastor, secretary, finance, etc.)
- **Members**: Church membership registry with personal details
- **Events**: Calendar and service scheduling
- **Donations**: Financial contributions tracking (tithes, offerings, pledges)
- **Ministries**: Ministry groups with membership tracking
- **Welfare Cases**: Benevolence request workflow
- **Evangelism Records**: New convert and visitor tracking

### Design Patterns
- **Shared Types**: Schema definitions shared between frontend and backend via path aliases
- **API Contract**: Zod schemas define request/response types for type safety across the stack
- **Custom Hooks**: Each data domain has dedicated hooks for CRUD operations
- **Component Composition**: shadcn/ui components with consistent styling patterns

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database (`@neondatabase/serverless`)
- **Connection**: Requires `DATABASE_URL` environment variable

### Authentication
- **Sessions**: Requires `SESSION_SECRET` environment variable
- **Session Storage**: PostgreSQL via `connect-pg-simple`

### UI Libraries
- **Radix UI**: Accessible component primitives (dialog, dropdown, select, etc.)
- **Lucide React**: Icon library
- **Recharts**: Dashboard analytics charts
- **date-fns**: Date formatting and manipulation

### Development Tools
- **Vite**: Development server with HMR
- **Drizzle Kit**: Database migrations (`npm run db:push`)
- **TypeScript**: Type checking (`npm run check`)