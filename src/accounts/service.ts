import { Handler, Request, Response, Router } from "express";
import { Request as RequestJWT } from "express-jwt";
import { JSONCodec, NatsConnection } from "nats";
import { z } from "zod";
import { AccountsRepository } from "./repository.js";
import { Account, hash, newAccount } from "./domain.js";
import { JWTAuth } from "./jwtauth.js";

export class AccountsService {
    constructor(
        private readonly _jwtauth: JWTAuth,
        private readonly _repo: AccountsRepository,
        private readonly _bus: NatsConnection,
        public router = Router()
    ) {
        this.routes();
    }

    private routes() {
        this.router
            .post("/", this.handleRegister())
            .post("/session", this.handleLogin())
            .get("/me", this._jwtauth.verify(), this.handleAccountInfo());
    }

    public handleRegister(): Handler {
        const _z = z
            .object({
                email: z.string().email(),
                name: z.string().max(30),
                password: z.string(), // TODO: add password validation
                // TODO: add password confirmation
            })
            .transform(async (data) => {
                const hashed = await hash(data.password);
                return newAccount(data.email, data.name, hashed);
            });

        return async (req, res) => {
            try {
                const account = await _z.parseAsync(req.body);
                // repo, add to database
                const _ = await this._repo.insert(account);

                /* const _ = await */ this._publish(account, "account.registered");

                this._json(req, res, { account }, 201);
            } catch (error) {
                this._json(req, res, { error }, 500);
            }
        };
    }

    public handleLogin(): Handler {
        const _z = z
            .object({
                email: z.string().email(),
                password: z.string(),
            });

        return async (req, res) => {
            try {
                const { email, password } = await _z.parseAsync(req.body);

                const { id } = await this._repo.authenticate({ email, password });

                const accessToken = await this._jwtauth.sign({ subject: id });

                this._json(req, res, { accessToken }, 200);
            } catch (error) {
                this._json(req, res, { error }, 500);
            }
        };
    }

    public handleAccountInfo(): Handler {
        return async (req: RequestJWT, res) => {
            // TODO: read from jwt
            this._json(req, res, { auth: req.auth }, 200);
        };
    }

    /**
     * Helper for sending json responses to client.
     */
    private _json(req: Request, res: Response, data: Record<string, unknown>, code: number) {
        res.status(code).send(data);
    }

    /**
     * Publish the event to the event bus.
     */
    private _publish(data: unknown, subject: string) {
        this._bus.publish(subject, JSONCodec().encode(data));
    }
}