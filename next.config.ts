/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Fix for libraries loading files from node_modules (e.g. push-receiver .proto files)
  serverComponentsExternalPackages: ["@liamcottle/push-receiver", "better-sqlite3"],
};

export default nextConfig;
