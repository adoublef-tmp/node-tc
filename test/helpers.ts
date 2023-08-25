/**
 * Global test variables
 */
import { SignOptions } from "jsonwebtoken";
import { JWTAuth } from "../src/accounts/jwtauth";
import { PrismaClient } from "@prisma/client";
import { beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";

/** for testing purposes only */
const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA19+o9rWiq8Y53w3j/gKb/h+pNGZPTtZWpAhbi+647aNxuuxw
AvPODpJYaReXMOGczouxbyQsZHhWqpP+BnKTi585q37BW6uUD7Df4BXtn+LZf9g1
DiRz4n0zmC4wVcuv3EaacwLwYAF0P+R/fJQ7N1QfZ65s7Icw/xLczmxMEqLzsgCb
Kpb0GPeshqB5rC458WF/Ps0bRBGvPBe37aoxg3ofZvmbJ+WiUtVyWG8KJ1n9Iaco
uIT4MX9STrDKT8GuQhxNMtTA0PBR04R5az56KN+Qf4yfZxL9V5rZtwB5p1C9OaDy
s2+eZsiFy1fosL70qZweHT3FRPjU8yqX59DPuwIDAQABAoIBAQDB0iTIbcjCZdYr
+TLNK9aXUiH/1CQ86qEb4g0gFJShePByHjtryy8lUixjHzU2RDsgD7idy2K4Snu1
5+5aJ6Fl6O5ElihRgDoN5Ib9kXKq7WjPKnZoXj5WCoe6iS4IujsJkbK2tNrRuDyB
6Uy1s/l+8d7InolZzQAm5O6vv/iFeXXWozmijxgcHVzjMwbGFWA6PRLBNb/0YbM6
qA2c6qmBeIVZtHYN0Hh5/Ew63MJ79C8PNBAUVX19iFa20St4WCKjm0TkouGHE6PL
cxXB30g9GYgcwO1c4Y3pvPS6VFspk6qbAexFmu1sAeO9mH/eS8V3AZ/AGwiyP8PX
33qDqJNhAoGBAP5LPTGvNuNLZvkpGRRAVU95Nt7WYtIiRxhG7SGMIJsWHI7iJDcF
avpY9L0sVeKTADeqnyhsmgclcJUTDXVaJLQVQCQwSoRymph0h9h8BGY+i2vPQZvy
Xn6sSTx6ZNrS4hQSquPZ9CZqQmnfu4QzmywyzEOBHRdpp+C8Qg4FzfDTAoGBANlS
brroyl/0An3Qt3ZMAjyjHD00F55aBTzoHhmVTNMnHIBnNOFB+bX3Oq2JRGKmOFze
pB0dCYTDmlUieXXKmsNJ7DHH/XmFbLEQtxDCTnAzB13juMDdrFRd4efB7Itfwxae
sm9UzNam8yv+bAiBF3sCv+sraHPQTGTjhu0UwJR5AoGAcY6DyzYlWqcHWujBbEu2
TQEiQayXAKOSAANcTYjX3qmnIx9VcMSYmycyU3ADAmUGydUFsfWdaueLOOcDMY6J
qWl79S0jebX712ziZQgspsPzWrd44vz+ua6SHdHCS/20O6aCbbGc17LH6aOhh03M
U5ZzpQl5RkVGVJN9I+nvp0UCgYEAgnLrysAvslc7I6Ckb5sCgLl8GvTo9IGewUen
wb2P5vOENUM+R7Sdmu+zRjWuWfTiwkRWiK9EZnAvdMkD1YPvUChQYjVk3owLiWG6
MZIhGVJYKrCl1wd5CQ9tqfsK7UJnTW2nOBLT/kkqkI7g9F3g5VLqNtTQlyxCnxDA
jhE15CkCgYBWKx5I+E7CmM7KJ2BP+/GcyiN7p/UF5h7ga5kb0p/NSrIxSdYareZz
J32caqXHAzXDPYHei2Rxqsmaj8HiNCvbupGY5WXjacs0JTowVn+Ws59kaGYZgTYr
EPND3akxV/VESy+oBJ+6LIfLS2pUjVjOMm50HQa8zDofAwXT3yx63w==
-----END RSA PRIVATE KEY-----`;
/** for testing purposes only */
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA19+o9rWiq8Y53w3j/gKb
/h+pNGZPTtZWpAhbi+647aNxuuxwAvPODpJYaReXMOGczouxbyQsZHhWqpP+BnKT
i585q37BW6uUD7Df4BXtn+LZf9g1DiRz4n0zmC4wVcuv3EaacwLwYAF0P+R/fJQ7
N1QfZ65s7Icw/xLczmxMEqLzsgCbKpb0GPeshqB5rC458WF/Ps0bRBGvPBe37aox
g3ofZvmbJ+WiUtVyWG8KJ1n9IacouIT4MX9STrDKT8GuQhxNMtTA0PBR04R5az56
KN+Qf4yfZxL9V5rZtwB5p1C9OaDys2+eZsiFy1fosL70qZweHT3FRPjU8yqX59DP
uwIDAQAB
-----END PUBLIC KEY-----`;

export const jwtauth = new JWTAuth([PRIVATE_KEY, PUBLIC_KEY, "RS256"]);

export const sign = (options?: Partial<SignOptions> | undefined, payload?: Record<string, unknown>) => {
    return jwtauth.sign(options, payload);
};

export const newPrismaClient = (DATABASE_URL: string) => {
    const client = new PrismaClient({
        datasources: { db: { url: DATABASE_URL } },
    });

    beforeAll(() => {
        execSync("npx prisma db push", {
            env: { ...process.env, DATABASE_URL },
        });
    });

    afterAll(async () => {
        await client.$disconnect();
    });

    return client;
}; 