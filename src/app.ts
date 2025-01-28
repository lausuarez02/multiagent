import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

const app = new Hono();

app.use(cors({ origin: "*" }));
app.use(logger());

export { app };
