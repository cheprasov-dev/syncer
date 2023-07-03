import "dotenv/config";

export const { DB_URI, RABBIT_USER, RABBIT_PASSWORD, RABBIT_HOST } =
  process.env;

export const RABBIT_PORT = Number(process.env.RABBIT_PORT);
