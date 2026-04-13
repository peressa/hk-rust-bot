/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Set output to standalone for optimized Docker deployment
  output: 'standalone',
  
  // Moved from experimental to top-level in Next.js 14+
  serverExternalPackages: ["@liamcottle/push-receiver", "better-sqlite3", "discord.js", "@discordjs/ws"],
  
  experimental: {
    // Keep empty as instrumentationHook is default and other keys removed
  }
};

export default nextConfig;
