/**
 * Production server for hosts that start ONE Node.js file in-process, such as CloudLinux / Passenger
 * (Hostinger shared and cloud hosting: `cloudlinux-selector`). The host hands the app a port or socket
 * through `listen()`, so Next.js must run inside this process (not as a child process).
 *
 * CLI: `node server.js` (PORT, default 3100). Run `npm run build` first. Output: Next.js request log.
 * The background worker starts through instrumentation.ts, exactly as with `next start`.
 */
const http = require("node:http");
const next = require("next");

const port = Number(process.env.PORT) || 3100;
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  http.createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`SEOKaroAI ready on port ${port}`);
  });
}).catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
