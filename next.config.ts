import type { NextConfig } from "next";

// Some hosting panels (e.g. Hostinger) import every name from .env.example and refuse empty values.
// A value of "-" or "none" means "not set": drop it before the build and the server read env, so the
// admin Integrations page (or the built-in default) is used instead of a placeholder.
for (const [k, v] of Object.entries(process.env)) {
  if (v != null && ["-", "none"].includes(v.trim().toLowerCase())) delete process.env[k];
}

const nextConfig: NextConfig = {
  // Self-contained server in .next/standalone (with its own traced node_modules and server.js), so hosts
  // that copy only part of the project (Hostinger Node.js apps, Passenger) still get every file.
  output: "standalone",
  // The Agent SDK spawns a native Claude Code binary; keep it out of the bundle.
  serverExternalPackages: ["@anthropic-ai/claude-agent-sdk"],
  outputFileTracingExcludes: { "*": ["./data/**/*"] },
  // Next 16's tracer misses files its own server requires at startup (e.g. lib/metadata/get-metadata-route).
  outputFileTracingIncludes: { "*": ["./node_modules/next/dist/lib/**/*", "./node_modules/next/dist/server/**/*", "./node_modules/next/dist/shared/**/*"] },
};

export default nextConfig;
