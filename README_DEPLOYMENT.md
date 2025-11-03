# Netlify Deployment Guide

## Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Environment Variables**: Set up in Netlify dashboard

## Environment Variables Required

Add these in Netlify Dashboard → Site Settings → Environment Variables:

### Required
- `XS2_API_KEY` - Your XS2 Event API key
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `NEXT_PUBLIC_BASE_URL` - Your production URL (e.g., `https://your-site.netlify.app`)

### Optional
- `NODE_ENV` - Set to `production`

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

## Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Test the homepage loads correctly
- [ ] Test event browsing and filtering
- [ ] Test event detail pages
- [ ] Verify API routes are working
- [ ] Check that images are loading correctly
- [ ] Test mobile responsiveness
- [ ] Verify Stripe payment flow (if applicable)

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

