/** Starts the background worker once per Node.js server process (not in the edge runtime). */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  dropPlaceholderEnv();
  await guardStdin();
  const { startWorker } = await import("./lib/worker");
  startWorker();
}

/**
 * Hosting panels that refuse empty variables (Hostinger) get "-" or "none" as placeholders. The server
 * reads env at runtime (next.config.ts does not run in a standalone server), so drop them here, before
 * any setting is read, and the admin Integrations values or built-in defaults apply instead.
 */
function dropPlaceholderEnv() {
  for (const [k, v] of Object.entries(process.env)) {
    if (v != null && ["-", "none"].includes(v.trim().toLowerCase())) delete process.env[k];
  }
}

/**
 * LiteSpeed / Passenger (Hostinger) start the app with a stdin that Node cannot open: reading
 * process.stdin throws "open EEXIST", and any ESM import of node:process reads it. The server never
 * reads stdin, so swap in an empty stream before anything else loads.
 */
async function guardStdin() {
  try {
    void process.stdin;
  } catch {
    const mod = (await import("node:stream")) as unknown as { Readable?: typeof import("node:stream").Readable; default?: { Readable: typeof import("node:stream").Readable } };
    const Readable = mod.Readable ?? mod.default!.Readable;
    const empty = new Readable({ read() { this.push(null); } });
    Object.defineProperty(process, "stdin", { configurable: true, enumerable: true, get: () => empty });
  }
}
