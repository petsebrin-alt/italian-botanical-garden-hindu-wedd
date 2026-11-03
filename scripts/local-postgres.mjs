// An in-memory Postgres (PGlite) on 127.0.0.1:5433, for trying the database
// store without installing anything:
//   npm run db:local
//   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/postgres npm run dev
// Data disappears when this process stops.
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const port = Number(process.env.PORT || 5433);
const db = await PGlite.create();
// PGlite is single-connection; the server multiplexes so each route's pool can connect
const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1", maxConnections: 20 });
await server.start();
console.log(`local Postgres ready: postgresql://postgres:postgres@127.0.0.1:${port}/postgres`);

const stop = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
