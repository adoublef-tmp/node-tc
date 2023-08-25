import { execSync } from "node:child_process";
import { PostgreSqlContainer, NatsContainer } from "testcontainers";
import { PrismaClient } from "@prisma/client";
import { connect } from "nats";
import { CONFIG } from "../config";
import { createServer } from "../app";

const [postgresContainer, natsContainer] = await Promise.all([
    new PostgreSqlContainer().start(),
    new NatsContainer().start()
]);

const natsConn = await connect(natsContainer.getConnectionOptions());

const DATABASE_URL = postgresContainer.getConnectionUri();

const client = new PrismaClient({
    datasources: { db: { url: DATABASE_URL } },
});

execSync("npx prisma db push", {
    env: { ...process.env, DATABASE_URL },
});

const server = await createServer(client, natsConn);

server.listen(CONFIG.port, () => {
    console.log(`Listening on port ${CONFIG.port}`);
});
