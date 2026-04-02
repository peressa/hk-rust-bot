/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // In Next.js 15+, the key changed to serverExternalPackages
  serverExternalPackages: ["@liamcottle/push-receiver", "better-sqlite3"],
  experimental: {
    // Ensuring Turbopack respects the external packages
    serverComponentsExternalPackages: ["@liamcottle/push-receiver", "better-sqlite3"],
    instrumentationHook: true,
  }
};

export default nextConfig;
