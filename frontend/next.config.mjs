/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  async rewrites() {
    return [
      { source: '/tests/:path*', destination: '/dashboard/tests/:path*' },
      { source: '/tests', destination: '/dashboard/tests' },
      { source: '/classes/:path*', destination: '/dashboard/classes/:path*' },
      { source: '/classes', destination: '/dashboard/classes' },
      { source: '/institution/:path*', destination: '/dashboard/institution/:path*' },
      { source: '/institution', destination: '/dashboard/institution' },
    ];
  },
};

export default nextConfig;

