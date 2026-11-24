#!/usr/bin/env node
/**
 * Production start: `next start` on the port the host gives (PORT, as on Hostinger Node.js apps),
 * falling back to 3100 locally. CLI: `node scripts/start.mjs` (npm start). No output of its own.
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const next = require.resolve("next/dist/bin/next");
const port = process.env.PORT || "3100";
const child = spawn(process.execPath, [next, "start", "-p", port], { stdio: "inherit" });
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
child.on("exit", (code) => process.exit(code ?? 0));
