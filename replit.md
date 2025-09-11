# MadEasy Browser - AI-Powered Autonomous Web Browser

## Overview

MadEasy Browser is a standalone AI-powered web browser designed to autonomously perform web-based tasks including research, data extraction, form filling, and complex workflow automation. Built as a full-stack application with React frontend and Express backend, it features a chat-first interface where users describe goals and the system creates actionable plans with autonomous execution capabilities at multiple autonomy levels (Manual, Co-pilot, Autopilot, and PM Mode).

### V2 Features (January 2025)
- **Multi-Agent Orchestration 2.0**: Specialized AI agents (Planner, Critic, Executor, Researcher, Fixer) working together with consensus protocols
- **QA Suite Pro**: Lighthouse integration, visual regression testing, accessibility checks with axe-core
- **Selector Studio v2**: Intelligent selector analysis with stability scoring (0-100) and domain-specific learning profiles
- **Watched Workflows**: Scheduled automation with RRULE support and content change detection
- **Lead Data Vault**: Admin-only centralized lead storage with enrichment, deduplication, and GDPR compliance modes
- **Marketplace**: Community playbooks and plugins with sandboxed execution and security verification
- **Policy Guard**: Rule engine for evaluating actions against security policies with simulation mode
- **Collaborative Mode**: Real-time shared sessions with live cursors, comments, @mentions, and review rules

### Recent Updates (September 2025)
- **Sprint 1 Complete**: Core browsing functionality fully implemented and working
- **Sprint 2 Complete**: Electron desktop app with CORS-free browsing, native menus, system tray, auto-updates
- **Navigation Fixed**: URL input with Enter key navigation working correctly
- **Tab Management**: Full tab creation, switching, and closing functionality with BrowserView integration
- **History & Bookmarks**: PostgreSQL persistence with UI panels for management
- **Downloads Tracking**: Complete download monitoring with native file system integration
- **CORS Bypass**: Toggleable CORS-free mode for external sites in Electron
- **Security Hardened**: Scoped permissions, development/production mode separation
- **Native Features**: Global shortcuts, system tray, native menus, auto-updater configured

### MadEasy V3.00 - Vibecoding Platform (January 2025)
- **Multi-Agent Orchestration**: Specialized AI team with Leader, PM, Architect, Engineer, and Data Analyst agents working with consensus protocols
- **Vibe Profiler v3**: Comprehensive project configuration defining stack, quality requirements, security policies, and constraints
- **Goal Tracker**: Streamlined micro-interactions with gamification, live progress tracking, and achievement celebrations
- **Platform Evolution**: Transitioning from browser to complete development ecosystem with integrated IDE, marketplace, and community hub
- **Inter-Agent Messaging**: Structured communication protocol with negotiation and consensus mechanisms

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development
- **UI System**: Shadcn/ui components with Radix UI primitives for consistent design
- **Styling**: Tailwind CSS with custom design system and dark theme support
- **State Management**: TanStack Query for server state and local React state for UI
- **Routing**: Wouter for lightweight client-side routing
- **Component Structure**: Modular architecture with dedicated components for browser viewport, workflow builder, data dashboard, and navigation

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints for projects, workflows, automation tasks, and activity logs
- **Storage**: In-memory storage implementation with interface for future database integration
- **Session Management**: Express session with PostgreSQL store preparation

### Data Storage Solutions
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Database**: PostgreSQL with Neon serverless driver
- **Schema**: Comprehensive schema for projects, workflows, automation tasks, activity logs, and extracted leads
- **Migration System**: Drizzle Kit for database migrations and schema management

### Authentication and Authorization
- **Session-based**: Express sessions with connect-pg-simple for PostgreSQL storage
- **Permissions**: Domain-scoped permissions system for automation tasks
- **Security**: Built-in secrets vault and privacy filtering in logs

### Core Application Features
- **Browser Automation**: CDP/DOM manipulation with visual recognition capabilities
- **Workflow Engine**: DSL-based workflow creation with no-code editor
- **Data Processing**: Automated scraping, parsing, deduplication, validation, and export
- **Project Management**: Development project coordination with external AI services
- **Observability**: Screenshot capture, DOM extraction, network logging, and replay functionality

### Design System
- **Theme**: Dark-first design with CSS custom properties
- **Typography**: Inter font with multiple weight variants
- **Components**: Comprehensive UI component library with consistent styling
- **Responsive**: Mobile-first responsive design approach

## External Dependencies

### Core Technologies
- **Database**: Neon PostgreSQL serverless with connection pooling
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **UI Framework**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with PostCSS processing
- **Development**: Vite with TypeScript and React plugins

### Development Tools
- **Build System**: Vite for frontend bundling and ESBuild for backend
- **Type Safety**: TypeScript with strict configuration
- **Code Quality**: Replit development environment integration
- **Form Handling**: React Hook Form with Zod validation

### Third-party Integrations
- **Development Platforms**: Planned integrations with Lovable, Bolt, and Replit for development workflow coordination
- **Browser Automation**: Chrome DevTools Protocol (CDP) for browser control
- **Data Export**: Multiple format support including CSV, JSON, and PDF generation
- **Query Management**: TanStack Query for efficient data fetching and caching

### Deployment Infrastructure
- **Environment**: Replit-optimized with development banner and cartographer integration
- **Database**: Neon PostgreSQL with environment-based configuration
- **Asset Management**: Attached assets support for project documentation