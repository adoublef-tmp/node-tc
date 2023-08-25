import { Algorithm } from "jsonwebtoken";

export const CONFIG = {
    port: 8080,
    origin: "http://localhost:5173",
    keys: {
        public: "__public__",
        private: "__private__",
        algo: "RS256" as Algorithm,
    },
} as const;
