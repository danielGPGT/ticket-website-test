# XS2 Ticket Marketplace

A Next.js App Router marketplace for selling sports event tickets via XS2 Event API.

## Tech Stack
- Next.js 16 (App Router) + TypeScript + Tailwind v4
- shadcn/ui
- Zustand
- Supabase
- Stripe
- React Hook Form + Zod

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` with:
   ```env
   XS2_API_KEY=
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
   STRIPE_SECRET_KEY=
   STRIPE_WEBHOOK_SECRET=
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```

## Routes
- GET /api/xs2/events → lists future events (filters by date_stop >= today)
- GET /api/xs2/tickets?event_id=... → available tickets for an event
- GET /api/xs2/categories?event_id=... → categories for an event
- POST /api/stripe/checkout → creates PaymentIntent
- POST /api/stripe/webhook → Stripe webhook (set endpoint and secret in Stripe)
- POST /api/orders → create order in Supabase

## Development Notes
- Do not expose the XS2 API key on the client; all calls are proxied via API routes.
- Tickets are grouped by `event_id + category_id + sub_category` and sorted by min price.
- Before checkout ensure stock is available.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
