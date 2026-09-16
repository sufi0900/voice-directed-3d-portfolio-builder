import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // These Node-only document parsers must not be rewritten by the route bundler.
  // Bundling pdf-parse's optional native canvas package breaks on Windows.
  serverExternalPackages: ["pdf-parse", "mammoth"],
};

export default nextConfig;
