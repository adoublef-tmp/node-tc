import { PrismaClient } from "@prisma/client";
import { connect } from "nats";
import { NatsContainer, PostgreSqlContainer, StartedPostgreSqlContainer } from "testcontainers";
import { beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { execSync } from "node:child_process";
import express from "express";
import { jwtauth } from "..";

export const APPLICATION_JSON = "application/json";
export const APPLICATION_SSE = "text/event-stream";

export const createRepository = async (container?: StartedPostgreSqlContainer) => {
    if (!container) {
        container = await new PostgreSqlContainer().start();
    }

    const DATABASE_URL = container.getConnectionUri();

    const client = new PrismaClient({
        datasources: { db: { url: DATABASE_URL } },
    });

    // insert some default

    beforeAll(() => {
        execSync("npx prisma db push", {
            env: { ...process.env, DATABASE_URL },
        });
    });

    afterAll(async () => {
        await container?.stop();
    });

    const { FactsRepository } = await import("../../src/facts/repository");

    return { repository: new FactsRepository(client.fact), client };
};

export const createServer = async () => {
    const [postgresContainer, natsContainer] = await Promise.all([
        new PostgreSqlContainer().start(),
        new NatsContainer().start()
    ]);

    const { repository, client } = await createRepository(postgresContainer);

    const natsConn = await connect(natsContainer.getConnectionOptions());

    const { FactsService } = await import("../../src/facts/service");

    const service = new FactsService(jwtauth, repository, natsConn);

    const app = express()
        .use(express.json())
        .use(service.router)

    return { server: supertest(app), client };
};
