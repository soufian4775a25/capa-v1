# ChargeCapa - Training Capacity Management System

## Overview

ChargeCapa is a professional web application designed for training centers to calculate and visualize their capacity-workload balance. The system helps training organizations evaluate their real capacity to launch new training programs by providing a comprehensive view of resource utilization (trainers, rooms, workshops) and enabling quick, informed decision-making.

The application manages trainers and their specialties, training modules and programs, training groups, rooms and workshops, and provides automated capacity calculations with visual dashboards and reporting capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: shadcn/ui components built on top of Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **Form Handling**: React Hook Form with Zod schema validation
- **Authentication**: Context-based authentication with localStorage persistence

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **API Design**: RESTful API with structured error handling and request logging
- **Development Setup**: Hot reloading with Vite middleware integration
- **Build Process**: ESBuild for server bundling, Vite for client bundling

### Data Storage Solutions
- **Primary Database**: PostgreSQL hosted on Neon (serverless)
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Schema Design**: Normalized relational structure with tables for users, trainers, modules, rooms, training groups, module-trainer assignments, and group-module schedules
- **Migrations**: Drizzle Kit for schema migrations and database management
- **Connection**: Connection pooling with @neondatabase/serverless

### Authentication and Authorization
- **Strategy**: Simple username/password authentication with role-based access
- **Session Management**: Client-side storage using localStorage (development setup)
- **User Roles**: Admin role system with future extensibility
- **Route Protection**: Context-based authentication checks on protected routes

### Key Business Logic Components
- **Capacity Calculation Engine**: Automated calculation of trainer workload and room occupancy
- **Resource Management**: Comprehensive management of trainers, modules, training groups, and facilities
- **Scheduling System**: Module-trainer assignment and group-module scheduling with conflict detection
- **Progress Tracking**: Training group progress monitoring with delay tracking
- **Dashboard Analytics**: Real-time metrics and KPI visualization
- **Export System**: PDF and Excel export functionality for reports and data

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting platform
- **Connection Management**: WebSocket-based connections for serverless compatibility

### UI Component Libraries
- **Radix UI**: Headless UI components for accessibility and functionality
- **Lucide React**: Icon library for consistent iconography
- **Embla Carousel**: Carousel component for data presentation

### Development Tools
- **Vite**: Frontend build tool and development server
- **Replit Integration**: Development environment plugins for enhanced DX
- **TypeScript**: Static type checking across the entire stack

### Data Handling Libraries
- **Zod**: Runtime type validation and schema definition
- **React Hook Form**: Form handling with validation integration
- **Date-fns**: Date manipulation and formatting utilities

### Styling and Design
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing and optimization
- **Class Variance Authority**: Component variant management