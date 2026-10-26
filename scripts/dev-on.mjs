// Local dev for on.aboustate.tech: same Vite server, but page navigations
// render on-app.html (see the on-dev plugin in vite.config.js).
import { createServer } from "vite";

process.env.ON_DEV = "1";
const server = await createServer({ server: { port: Number(process.env.PORT) || 5180 } });
await server.listen();
server.printUrls();
