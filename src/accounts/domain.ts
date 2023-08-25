import { hash as hash2, verify } from "argon2";
import { createId, isCuid } from "@paralleldrive/cuid2";

/**
 * Hash a password
 */
export const hash = (password: string) => {
    // check this is a valid password
    return hash2(password);
};

/**
 * Compare a password with a hash
 */
export const compare = async (account: Account, password: string) => {
    return verify(account.password, password);
};

export const newAccount = (email: string, name: string, password: string, id: string = createId()) => {
    if (!isCuid(id))
        throw new Error("Invalid id");

    return {
        email,
        name,
        password,
        id,
    };
}

export type Account = ReturnType<typeof newAccount>;
