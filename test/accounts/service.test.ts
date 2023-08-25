import { describe, it, expect } from "vitest";
import { APPLICATION_JSON, APPLICATION_SSE, createServer } from ".";

describe(
    "testing auth repository",
    async () => {
        const { server } = await createServer();

        it("should add a new fact to the database", async () => {
            const created = await server
                .post("/")
                .set("Accept", APPLICATION_JSON)
                .send({
                    email: "test@mail.com",
                    name: "test",
                    password: "password",
                });

            expect(created.status).toBe(201);
        });

        it("should register the user and return a token", async () => {
            const login = await server
                .post("/session")
                .set("Accept", APPLICATION_JSON)
                .send({
                    email: "test@mail.com",
                    password: "password",
                });

            expect(login.status).toBe(200);

            const { accessToken } = login.body;
            expect(accessToken).toBeDefined();

            const me = await server
                .get("/me")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(me.status).toBe(200);
        });
    },
    { timeout: 30_000 }
);
