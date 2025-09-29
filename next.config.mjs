/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/lexiconic',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig