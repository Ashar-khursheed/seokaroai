import type { NextConfig } from "next";

// Some hosting panels (e.g. Hostinger) import every name from .env.example and refuse empty values.
// A value of "-" or "none" means "not set": drop it before the build and the server read env, so the
// admin Integrations page (or the built-in default) is used instead of a placeholder.
for (const [k, v] of Object.entries(process.env)) {
  if (v != null && ["-", "none"].includes(v.trim().toLowerCase())) delete process.env[k];
}

const nextConfig: NextConfig = {
  // The Agent SDK spawns a native Claude Code binary; keep it out of the bundle.
  serverExternalPackages: ["@anthropic-ai/claude-agent-sdk"],
  outputFileTracingExcludes: { "*": ["./data/**/*"] },
};

export default nextConfig;
