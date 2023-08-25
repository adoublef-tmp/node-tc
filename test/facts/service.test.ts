import { describe, it, expect } from "vitest";
import { APPLICATION_JSON, createServer } from ".";
import { createId } from "@paralleldrive/cuid2";
import { sign } from "..";

describe(
    "testing auth repository",
    async () => {
        const { server } = await createServer();

        // insert a user
        const [fooId, barId] = [createId(), createId()];

        const [fooAccessToken, barAccessToken] = await Promise.all([sign({ subject: fooId }), sign({ subject: barId })]);

        it("should add a new fact to the database", async () => {
            // insert five facts
            for (let i = 0; i < 5; i++) {
                const res = await server
                    .post("/")
                    .set("Accept", APPLICATION_JSON)
                    .set("Authorization", `Bearer ${fooAccessToken}`)
                    .send({
                        info: `test${i}`,
                        source: `https://example.com/${i}`,
                    });

                expect(res.status).toBe(201);
            }
        });

        it("should list all facts from the database", async () => {
            const res = await server.get("/").set("Accept", APPLICATION_JSON);

            expect(res.status).toBe(200);
            expect(res.body.facts).toHaveLength(5);
        });
    },
    { timeout: 30_000 }
);
