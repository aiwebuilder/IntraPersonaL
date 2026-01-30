import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', port: '', pathname: '/**' },
    ],
  },
  // UPDATE THIS PART
  async rewrites() {
    return [
      {
        source: '/ads.txt',       // The URL the user visits
        destination: '/google-ads', // The internal route we created in Step 1
      },
    ];
  },
};

export default nextConfig;
