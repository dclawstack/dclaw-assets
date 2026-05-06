/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://dclaw-assets-backend:8131/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
