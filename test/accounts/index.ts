import { afterAll, beforeAll } from "vitest";
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { NatsContainer, PostgreSqlContainer, StartedPostgreSqlContainer } from "testcontainers";
import { connect } from "nats";
import express, { json } from "express";
import supertest from "supertest";
import { JWTAuth } from "../../src/accounts/jwtauth";
import { jwtauth } from "../helpers";

export const APPLICATION_JSON = "application/json";
export const APPLICATION_SSE = "text/event-stream";

export const createRepository = async (container?: StartedPostgreSqlContainer) => {
    if (!container)
        container = await new PostgreSqlContainer().start();

    const DATABASE_URL = container.getConnectionUri();

    const client = new PrismaClient({
        datasources: { db: { url: DATABASE_URL } },
    });

    beforeAll(() => {
        execSync("npx prisma db push", {
            env: { ...process.env, DATABASE_URL },
        });
    });

    afterAll(async () => {
        await container?.stop();
    });

    const { AccountsRepository } = await import("../../src/accounts/repository");

    return { repository: new AccountsRepository(client.account) };
};

export const createServer = async () => {
    const [postgresContainer, natsContainer] = await Promise.all([
        new PostgreSqlContainer().start(),
        new NatsContainer().start()
    ]);

    const natsConn = await connect(natsContainer.getConnectionOptions());

    const { repository } = await createRepository(postgresContainer);

    const { AccountsService } = await import("../../src/accounts/service");

    const service = new AccountsService(jwtauth, repository, natsConn);

    const app = express()
        .use(json())
        .use(service.router);

    return { server: supertest(app) };
};
