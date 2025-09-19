# Supabase Integration Setup Guide

This guide will help you set up Supabase for your YouTube Directory application.

## Prerequisites

✅ Supabase dependencies are already installed
✅ Environment file (.env.local) is already created
✅ Supabase client configuration is ready

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `youtube-directory` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for project setup to complete (usually 2-3 minutes)

## Step 2: Get Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **Anon/Public Key** (starts with `eyJhbGciOiJIUzI1NiIs...`)

## Step 3: Update Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase-setup.sql` file
4. Paste it into the SQL editor
5. Click "Run" to execute the script

This will create:
- `videos` table with proper structure
- Row Level Security (RLS) policies
- Performance indexes
- Sample data (same as your current mock data)
- Helper functions for pagination

## Step 5: Configure Authentication (Optional but Recommended)

1. Go to **Authentication** → **Settings** in Supabase dashboard
2. Configure your preferred authentication providers
3. Update the site URL to your domain (for production)

For development, the default settings should work fine.

## Step 6: Test the Connection

1. Restart your development server: `npm run dev`
2. The app should now connect to Supabase instead of using mock data
3. Check the browser console for any connection errors

## Next Steps

Once Supabase is set up, the following features will be implemented:

### Phase 1: Basic Integration ✅ (Complete)
- [x] Dependencies installed
- [x] Environment configuration
- [x] Database schema
- [x] Client setup

### Phase 2: Authentication System
- [ ] Admin login/logout
- [ ] Protected admin routes
- [ ] Session management

### Phase 3: Database Integration
- [ ] Replace mock data with Supabase queries
- [ ] Real-time video loading
- [ ] Error handling

### Phase 4: CRUD Operations
- [ ] Add new videos from YouTube URLs
- [ ] Edit video information
- [ ] Delete videos
- [ ] Automatic thumbnail fetching

### Phase 5: Enhanced Features
- [ ] Real-time updates between admin and homepage
- [ ] Video search and filtering
- [ ] Tag management
- [ ] Analytics and usage tracking

## Troubleshooting

### Common Issues:

1. **"Missing Supabase environment variables" error**
   - Check that `.env.local` file exists and has correct values
   - Restart development server after updating environment variables

2. **Connection errors**
   - Verify Project URL and Anon Key are correct
   - Check that your Supabase project is active and running

3. **Database errors**
   - Ensure `supabase-setup.sql` was executed successfully
   - Check the Supabase logs in the dashboard

4. **RLS (Row Level Security) issues**
   - The current setup allows all read operations
   - Write operations require authentication
   - You can modify policies in the SQL Editor if needed

## Security Notes

- The anon key is safe to use in client-side code
- Row Level Security is enabled to protect your data
- Never expose your service_role key in client code
- Always use environment variables for credentials

## Database Schema Overview

### Videos Table Structure:
```sql
- id: UUID (Primary Key)
- youtube_id: VARCHAR (Unique)
- youtube_url: TEXT
- title: TEXT
- channel: TEXT
- thumbnail_url: TEXT
- description: TEXT
- published_at: TIMESTAMP
- tags: TEXT[] (Array)
- added_by_admin: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

Your YouTube Directory is now ready for dynamic content management! 🚀