import { Handler, Router, Request, Response } from "express";
import { Request as RequestJWT } from "express-jwt";
import { z } from "zod";
import { Fact, newFact } from "./domain.js";
import { FactsRepository } from "./repository.js";
import { JSONCodec, NatsConnection } from "nats";
import { Verifier } from "../accounts/jwtauth.js";

const sc = JSONCodec();

export class FactsService {
    constructor(
        private readonly _verifier: Verifier,
        private readonly _repo: FactsRepository,
        private readonly _bus: NatsConnection,
        public router = Router()
    ) {
        this.routes();
    }

    private routes() {
        this.router.post("/", this._verifier.verify(), this.handleAddFact());
        this.router.delete("/:id", this._verifier.verify(), this.handleRemoveFact());
        // NOTE: endpoint for upvoting/down-voting a fact
        this.router.get("/", this.handleFactsList());
        this.router.get("/stream", sse(), this.handleSubscribe());
    }

    public handleAddFact(): Handler {
        const q = z
            .object({
                info: z.string(),
                source: z.string().url(),
            })
            .transform((data) => {
                return newFact(data.info, data.source);
            });

        return async (req: RequestJWT, res) => {
            const { sub: accountId } = req.auth!;

            try {
                const fact = await q.parseAsync(req.body);
                // repo, add to database
                const _ = await this._repo.insert({ ...fact, accountId });

                /* const _ = await */ this._publish(fact, "fact.added");

                this._json(req, res, { fact }, 201);
            } catch (error) {
                this._json(req, res, { error }, 500);
            }
        };
    }

    public handleRemoveFact(): Handler {
        const q = z.object({ id: z.string().cuid() });
        return async (req, res) => {
            try {
                const { id } = await q.parseAsync(req.params);

                const _ = await this._repo.remove(id);

                /* const _ = await */ this._publish({ id }, "fact.removed");

                this._json(req, res, { id }, 200);
            } catch (error) {
                this._json(req, res, { error }, 500);
            }
        };
    }

    public handleFactsList(): Handler {
        return async (req, res) => {
            try {
                const facts = await this._repo.list();
                // 
                this._json(req, res, { facts }, 200);
            } catch (error) {
                this._json(req, res, { error }, 500);
            }
        };
    }

    public handleSubscribe(): Handler {
        const [factAdded, factRemoved] = [
            this._bus.subscribe("fact.added"),
            this._bus.subscribe("fact.removed")
        ];

        return async (req, res) => {
            try {
                (async () => {
                    for await (const msg of factAdded) {
                        const fact = JSONCodec<Fact>().decode(msg.data);
                        this._sse(req, res, fact);
                    }
                })();

                (async () => {
                    for await (const _msg of factRemoved) {
                        const { id } = JSONCodec<{ id: string; }>().decode(_msg.data);
                        this._sse(req, res, { id });
                    }
                })();
            } catch (e) {
                // TODO: handle error
                console.log(e);
            } finally {
                req.on("close", () => { console.log(`Connection closed`); });
            }
        };
    }

    /**
     * Helper for sending json responses to client.
     */
    private _json(req: Request, res: Response, data: Record<string, unknown>, code: number) {
        res.status(code).send(data);
    }

    /**
     * Helper for sending server-sent events to client.
     */
    private _sse(req: Request, res: Response, data: Record<string, unknown>, event = "message") {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        res.flush();
    }

    /**
     * Publish the event to the event bus.
     */
    private _publish(data: unknown, subject: string) {
        this._bus.publish(subject, sc.encode(data));
    }
}

function sse(): Handler {
    return (req, res, next) => {
        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Connection": "keep-alive",
            "Cache-Control": "no-cache",
        });
        next();
    };
}