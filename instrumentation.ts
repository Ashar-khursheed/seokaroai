/** Starts the background worker once per Node.js server process (not in the edge runtime). */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startWorker } = await import("./lib/worker");
  startWorker();
}
