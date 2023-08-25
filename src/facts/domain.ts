import { createId, isCuid } from "@paralleldrive/cuid2";

export const newFact = (info: string, source: string, accountId?: string, id: string = createId()) => {
    if (!isCuid(id))
        throw new Error("Invalid id");

    return ({
        info: info.trim(),
        source: new URL(source),
        accountId,
        id,
    });
};

export type Fact = ReturnType<typeof newFact>;