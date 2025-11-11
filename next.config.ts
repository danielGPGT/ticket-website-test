import type { NextConfig } from "next";

// Extract Supabase hostname from environment variable
const getSupabaseHostname = (): string | undefined => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return undefined;
  
  try {
    const url = new URL(supabaseUrl);
    return url.hostname;
  } catch {
    return undefined;
  }
};

const supabaseHostname = getSupabaseHostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      // Add Supabase Storage if URL is configured
      ...(supabaseHostname
        ? [
            {
              protocol: 'https' as const,
              hostname: supabaseHostname,
              pathname: '/storage/v1/object/public/**',
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
