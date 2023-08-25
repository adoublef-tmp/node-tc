import { describe, it, expect } from "vitest";
import { createRepository } from ".";
import { createId } from "@paralleldrive/cuid2";

describe("testing auth repository", async () => {
    const { repository } = await createRepository();

    const factA = createId();
    const accA = createId();

    it("should add a new fact to the database", async () => {
        const res = repository.insert({
            id: factA,
            accountId: accA,
            info: "test",
            source: new URL("https://example.com")
        });

        await expect(res).resolves.toBeUndefined();
    });

    it("should fail to add a new fact with the same id", async () => {
        const res = repository.insert({
            id: factA,
            accountId: accA,
            info: "test",
            source: new URL("https://example.com")
        });

        await expect(res).rejects.toThrow();
    });

    it("should list all facts", async () => {
        const facts = await repository.list();

        expect(facts).toHaveLength(1);
    });

}, { timeout: 30_000 });