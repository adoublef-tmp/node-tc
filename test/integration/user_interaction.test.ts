import { NatsContainer, PostgreSqlContainer } from "testcontainers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AccountsRepository, AccountsService, FactsRepository, FactsService } from "../../src/index";
import { jwtauth } from "../helpers";
import { connect } from "nats";
import express, { json } from "express";
import compression from "compression";
import supertest from "supertest";
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

describe("user creates an account and some uploads", async () => {
    const { server } = await init();

    it("should create a new account for `alex`", async () => {
        const res = await server
            .post("/accounts")
            .set("Content-Type", "application/json")
            .send({ email: "alex@mail.com", name: "alex", password: "1234" });

        expect(res.status).toBe(201);
    });

    it("should create a new account for `bella`", async () => {
        const res = await server
            .post("/accounts")
            .set("Content-Type", "application/json")
            .send({ email: "bella@mail.com", name: "bella", password: "1234" });

        expect(res.status).toBe(201);
    });

    let [alexToken, bellaToken]: [string, string] = ["", ""];

    it("should login both `alex`", async () => {
        const res = await server
            .post("/accounts/session")
            .set("Content-Type", "application/json")
            .send({ email: "alex@mail.com", password: "1234" });

        expect(res.status).toBe(200);

        alexToken = res.body.accessToken;
        expect(alexToken).toBeDefined();
    });

    it("should let `alex` upload a fact", async () => {
        const res = await server
            .post("/feed")
            .set("Content-Type", "application/json")
            .set("Authorization", `Bearer ${alexToken}`)
            .send({ info: "hello world", source: "https://example.com" });

        expect(res.status).toBe(201);
    });

    it("should login `bella`", async () => {
        const res = await server
            .post("/accounts/session")
            .set("Content-Type", "application/json")
            .send({ email: "bella@mail.com", password: "1234" });

        expect(res.status).toBe(200);

        bellaToken = res.body.accessToken;
        expect(bellaToken).toBeDefined();
    });

    it("should let `bella` view `alex`s facts & approve them", async () => {
        const res = await server
            .get("/feed?")

    })

}, { timeout: 30_000 });

async function init() {
    // SETUP CONTAINERS ENVIRONMENT
    const [postgresContainer, natsContainer] = await Promise.all([
        new PostgreSqlContainer().start(),
        new NatsContainer().start()
    ]);

    afterAll(async () => {
        await Promise.all([
            postgresContainer?.stop(),
            natsContainer?.stop()
        ]);
    });

    // SETUP DEPENDENCIES
    const conn = await connect(natsContainer.getConnectionOptions());

    const client = new PrismaClient({
        datasources: { db: { url: postgresContainer.getConnectionUri() } },
    });

    beforeAll(() => {
        const DATABASE_URL = postgresContainer.getConnectionUri();
        execSync("npx prisma db push", {
            env: { ...process.env, DATABASE_URL },
        });
    });

    // SETUP SERVICES
    const factsRepository = new FactsRepository(client.fact);
    const factsService = new FactsService(jwtauth, factsRepository, conn);

    const accountsRepository = new AccountsRepository(client.account);
    const accountsService = new AccountsService(jwtauth, accountsRepository, conn);

    const app = express()
        .use(compression({ level: -1 }))
        .use(json())
        .use("/accounts", accountsService.router)
        .use("/feed", factsService.router);

    const server = supertest(app);

    return { server, client, conn, postgresContainer, natsContainer };
}