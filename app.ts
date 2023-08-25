import { PrismaClient } from "@prisma/client";
import { NatsConnection } from "nats";
import express, { json } from "express";
import compression from "compression";
import cors from "cors";
import { CONFIG } from "./config.js";
import { AccountsRepository, AccountsService, FactsRepository, FactsService } from "./src/index.js";
import { JWTAuth } from "./src/accounts/jwtauth.js";

export const createServer = async (
    prismaClient: PrismaClient,
    natsConn: NatsConnection,
) => {
    const jwtauth = new JWTAuth([CONFIG.keys.public, CONFIG.keys.private, CONFIG.keys.algo]);

    const factsRepository = new FactsRepository(prismaClient.fact);
    const factsService = new FactsService(jwtauth, factsRepository, natsConn);

    const accountsRepository = new AccountsRepository(prismaClient.account);
    const accountsService = new AccountsService(jwtauth, accountsRepository, natsConn);

    const app = express()
        .use(cors({
            origin: CONFIG.origin, // todo
            credentials: true,
        }))
        .use(compression({ level: -1 }))
        .use(json())
        .use("/accounts", accountsService.router)
        .use("/feed", factsService.router);

    return app;
};