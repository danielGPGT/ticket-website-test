# Netlify Deployment Guide

## Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Environment Variables**: Set up in Netlify dashboard

## Environment Variables Required

**⚠️ IMPORTANT:** Add these in Netlify Dashboard → Site Settings → Environment Variables before deploying.

### Required (Backend - Server-side only)
- `XS2_API_KEY` - Your XS2 Event API key (used in API proxy routes)
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for admin operations)
- `STRIPE_SECRET_KEY` - Your Stripe secret key (starts with `sk_`)
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook signing secret (starts with `whsec_`)

### Required (Frontend - Public)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key
- `NEXT_PUBLIC_BASE_URL` - Your production URL (e.g., `https://your-site.netlify.app`)

### Optional
- `XS2_API_BASE` - XS2 API base URL (defaults to `https://api.xs2event.com/v1`)
- `NODE_ENV` - Automatically set to `production` by Netlify

### How to Add Environment Variables in Netlify

1. Go to your site in Netlify Dashboard
2. Navigate to **Site Settings** → **Environment Variables**
3. Click **Add a variable** for each variable above
4. Enter the variable name and value
5. Click **Save**
6. Redeploy your site for changes to take effect

### Notes
- **Never commit** `.env.local` or `.env` files to Git
- `NEXT_PUBLIC_*` variables are exposed to the browser - only include safe, public values
- Server-side variables (without `NEXT_PUBLIC_`) are never exposed to the client
- After adding environment variables, you must trigger a new deployment

## Deployment Steps

### Option 1: Deploy via Netlify Dashboard (Recommended)

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
5. Add environment variables (see above)
6. Click "Deploy site"

### Option 2: Deploy via Netlify CLI

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Initialize and deploy:
   ```bash
   netlify init
   netlify deploy --prod
   ```

## Build Configuration

The `netlify.toml` file is already configured with:
- Next.js plugin for optimal performance
- Node.js 20
- Correct build and publish directories

## Pre-Deployment Checklist

Before deploying, make sure you have all required environment variables:

### Backend Variables (Required)
- [ ] `XS2_API_KEY` - Get from XS2 Event API dashboard
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Get from Supabase Dashboard → Settings → API
- [ ] `STRIPE_SECRET_KEY` - Get from Stripe Dashboard → Developers → API keys
- [ ] `STRIPE_WEBHOOK_SECRET` - Get from Stripe Dashboard → Developers → Webhooks (after creating webhook endpoint)

### Frontend Variables (Required)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Get from Supabase Dashboard → Settings → API
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Get from Supabase Dashboard → Settings → API
- [ ] `NEXT_PUBLIC_BASE_URL` - Set to your Netlify URL (e.g., `https://your-site.netlify.app`)

## Post-Deployment Checklist

- [ ] Verify all environment variables are set correctly in Netlify
- [ ] Test the homepage loads correctly
- [ ] Test event browsing and filtering
- [ ] Test event detail pages
- [ ] Verify API routes are working (check Network tab for errors)
- [ ] Check that images are loading correctly
- [ ] Test mobile responsiveness
- [ ] Verify Stripe payment flow (if applicable)
- [ ] Test Supabase connection (if applicable)

## Troubleshooting

### Build Fails
- Check that all environment variables are set
- Verify Node.js version is 20
- Check build logs in Netlify dashboard

### API Routes Not Working
- Ensure `NEXT_PUBLIC_BASE_URL` is set to your Netlify URL
- Check that API keys are valid
- Verify CORS settings if needed

### Images Not Loading
- Check that Unsplash/placeholder URLs are accessible
- Verify `next.config.ts` remote patterns are correct

