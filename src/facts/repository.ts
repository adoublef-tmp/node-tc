import { PrismaClient } from "@prisma/client";
import { Fact, newFact } from "./domain.js";

export class FactsRepository {
    constructor(private readonly db: PrismaClient["fact"]) { }

    async insert({ id, accountId, info, source }: Fact): Promise<void> {
        try {
            if (!accountId)
                throw new Error("Invalid account id");

            const _ = await this.db.create({
                data: {
                    id,
                    accountId,
                    info: info.trim(),
                    source: source.toString(),
                },
            });
        } catch (error) {
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        // NOTE: fact will require a userId in future iterations
        try {
            const _ = await this.db.delete({ where: { id } });
        } catch (error) {
            throw error;
        }
    }

    async list(): Promise<Fact[]> {
        try {
            const facts = await this.db.findMany();
            return facts.map(
                ({ id, info, source }) => newFact(info, source, id));
        } catch (error) {
            throw error;
        }
    }
}
