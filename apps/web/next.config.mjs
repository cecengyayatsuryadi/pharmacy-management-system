/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  async redirects() {
    return [
      {
        source: '/dashboard/categories',
        destination: '/dashboard/inventory/master/categories',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
