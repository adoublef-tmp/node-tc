import { PrismaClient } from "@prisma/client";
import { Account, compare, newAccount } from "./domain.js";

export class AccountsRepository {
    constructor(private readonly db: PrismaClient["account"]) { }

    async insert({ id, email, password, name }: Account): Promise<void> {
        try {
            const _ = await this.db.create({
                data: {
                    id,
                    email,
                    password,
                    name,
                }
            });
        } catch (error) {
            throw error;
        }
    }

    async authenticate({ email, password }: Pick<Account, "email" | "password">): Promise<Account> {
        try {
            const account = await this.db.findUniqueOrThrow({
                where: { email },
            }).then(account => newAccount(account.email, account.name, account.password, account.id));

            if (!await compare(account, password))
                throw new Error("Invalid password");

            return account;
        } catch (error) {
            throw error;
        }
    }
}

export type Reader = Pick<AccountsRepository, "authenticate">;

export type Writer = Pick<AccountsRepository, "insert">;

