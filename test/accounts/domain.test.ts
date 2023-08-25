import { describe, it, expect } from "vitest";
import { Account, compare, hash, newAccount } from "../../src/accounts/domain";

describe("domain", () => {
    it("should create a new account", async () => {
        const hashed = await hash("password");

        const account = newAccount("test@mail.com", "test", hashed);

        expect(account.id).toBeDefined();

        expect(await compare(account, "password")).toBe(true);
    });
});