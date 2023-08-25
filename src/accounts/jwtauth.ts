import { Algorithm, sign, SignOptions } from "jsonwebtoken";
import { expressjwt as middleware, Params } from "express-jwt";
import { Handler } from "express";

export class JWTAuth {
    constructor(
        private readonly _keys: [privateKey: string, publicKey: string, algorithm: Algorithm],
    ) { }

    public async sign(options?: Partial<SignOptions>, payload: Record<string, unknown> = {}): Promise<string> {
        return sign(payload, this._keys[0], { ...options, algorithm: this._keys[2] });
    }

    public verify(options?: Partial<Params>): Handler {
        return middleware({ ...options, secret: this._keys[1], algorithms: [this._keys[2]] });
    }
}

export type Signer = Pick<JWTAuth, "sign">;

export type Verifier = Pick<JWTAuth, "verify">;