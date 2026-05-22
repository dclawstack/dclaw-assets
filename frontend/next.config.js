/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    const backend = process.env.BACKEND_URL || 'http://dclaw-assets-backend:8043'
    return [
      { source: '/health/:path*', destination: `${backend}/health/:path*` },
      { source: '/api/:path*',    destination: `${backend}/api/:path*` },
    ]
  },
}

module.exports = nextConfig
