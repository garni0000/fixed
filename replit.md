# FixedPronos - Replit Project

## Overview
This is a sports betting prediction platform (pronos) that has been migrated from Lovable to Replit. The application allows users to view betting predictions, subscribe to premium tiers, and earn commissions through a referral system.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query v5)
- **Authentication**: Firebase Auth + Supabase
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React

## Recent Changes (Migration to Replit)
- **Date**: November 21, 2025
- Configured Vite to run on port 5000 with host 0.0.0.0 (required for Replit webview)
- Added `allowedHosts: true` to Vite config for proper iframe support
- Installed Firebase package (was missing)
- Updated .gitignore to protect environment files
- Set up workflow to run development server on port 5000

## Project Structure
```
/
├── src/                    # Frontend source code
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   └── *.tsx         # Custom components
│   ├── pages/            # Page components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and API clients
│   ├── integrations/     # Third-party integrations
│   └── App.tsx           # Main app component
├── supabase/             # Supabase configuration
│   ├── migrations/       # Database migrations
│   └── config.toml      # Supabase config
├── backend/              # Separate backend service (not actively used)
└── public/               # Static assets
```

## User Preferences
- None documented yet

## Environment Variables Required

### Supabase (Already Configured)
- ✅ `VITE_SUPABASE_URL` - Supabase project URL
- ✅ `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon/public key
- ✅ `VITE_SUPABASE_PROJECT_ID` - Supabase project ID

### Firebase (User Must Provide)
The following Firebase credentials need to be added to your `.env` file:
- ⚠️ `VITE_FIREBASE_API_KEY` - Firebase API key
- ⚠️ `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- ⚠️ `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- ⚠️ `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- ⚠️ `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- ⚠️ `VITE_FIREBASE_APP_ID` - Firebase app ID

See `env.example` for reference.

### Optional
- `VITE_API_URL` - Backend API URL (if using the separate backend)

## How to Add Firebase Credentials
1. Go to your Firebase Console (https://console.firebase.google.com)
2. Select your project or create a new one
3. Go to Project Settings > General
4. Scroll to "Your apps" section and find your web app config
5. Copy the config values to your `.env` file
6. Restart the development server

## Database Schema
The project uses Supabase with the following main tables:
- `profiles` - User profiles with referral codes
- `user_roles` - User role assignments (user/admin)
- `subscriptions` - User subscription plans (basic/pro/vip)
- `pronos` - Betting predictions/tips
- `transactions` - Payment transactions
- `referrals` - Referral tracking and commissions

See `supabase/migrations/` for full schema details.

## Key Features
- User authentication (Firebase + Supabase)
- Multiple subscription tiers (Basic, Pro, VIP)
- Sports betting predictions with confidence scores
- Referral system with commission tracking
- Admin panel for managing pronos
- Responsive design with dark mode support

## Development
- Run `npm run dev` to start the development server on port 5000
- The workflow "Start application" is configured to auto-start
- Access the app through the Replit webview

## Notes
- The project has both Firebase and Supabase authentication integrated
- There's a separate backend folder with Prisma/Express, but the main app uses Supabase directly
- Row-Level Security (RLS) is enabled on all Supabase tables
- The app uses React Router for client-side routing
