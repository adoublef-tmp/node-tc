import { describe, it, expect } from "vitest";
import { hash, newAccount } from "../../src/accounts/domain";
import { createRepository } from ".";

describe("testing account repository", async () => {
    const { repository } = await createRepository();

    it("should add a new account to the database", async () => {
        const hashed = await hash("password");

        const account = newAccount("test@mail.com", "test", hashed);

        const res = repository.insert(account);

        await expect(res).resolves.toBeUndefined();
    });

    it("should fail to add a new account with the same email", async () => {
        const hashed = await hash("password");

        const account = newAccount("test@mail.com", "test", hashed);

        const res = repository.insert(account);

        await expect(res).rejects.toThrow();
    });

    it("should authenticate an account", async () => {
        const account = await repository.authenticate({
            email: "test@mail.com",
            password: "password"
        });

        expect(account).toBeDefined();
    });
});