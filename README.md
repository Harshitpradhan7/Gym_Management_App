# Bajrang Gym 2 Manager 🏋️‍♂️

A premium Gym Management System built for modern gym owners. Mobile-first, responsive, and easy to use.

## Features
- **Member Management**: Add, edit, and delete members with ease.
- **Auto-Expiry**: Automatically calculates membership expiry based on plan selection (Monthly, Quarterly, etc.).
- **Digital ID Cards**: Generates unique QR codes for each member.
- **Dashboard**: Quick view of members expiring today, this week, or already expired.
- **WhatsApp Alerts**: Daily automated notifications at 8 AM with a list of memberships to follow up on.

## Tech Stack
- **Frontend**: React 19, Tailwind CSS 4, Lucide Icons
- **Backend**: Supabase (Database + Auth)
- **Notifications**: Twilio WhatsApp API + Vercel Cron Jobs
- **Deployment**: Vercel

## Setup Instructions

### 1. Database Setup (Supabase)
1. Create a new project on [Supabase](https://supabase.com).
2. Go to the SQL Editor and run the contents of `supabase-setup.sql`.

### 2. Environment Variables
Create a `.env` file in the root directory and add the following:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_TWILIO_WA_URL=your_twilio_wa_cloud_function_url (if used)
```

### 3. Twilio Configuration (For Notifications)
Set these variables in your Vercel Project Settings:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_NUMBER` (e.g., `whatsapp:+14155238886`)
- `OWNER_WHATSAPP_NUMBER` (e.g., `whatsapp:+91XXXXXXXXXX`)
- `SUPABASE_SERVICE_ROLE_KEY` (Used in the API function)

### 4. Installation
```bash
npm install
npm run dev
```

## Folder Structure
- `/src/pages`: Individual screens (Dashboard, Members, etc.)
- `/src/components`: Reusable UI elements.
- `/api`: Serverless functions for WhatsApp notifications.
- `supabase-setup.sql`: Database schema.

---
Built with ❤️ for Bajrang Gym.
