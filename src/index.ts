import { createLogger, format, transports } from "winston";

import * as config from "./config";

const app = {
  name: "io-invitaition-manager",
};

const logger = createLogger({
  level: config.logLevel,
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  defaultMeta: { service: app.name },
  transports: [
    new transports.File({
      filename: `logs/${app.name}-error.log`,
      level: "error",
    }),
    new transports.File({ filename: `logs/${app.name}-combined.log` }),
    new transports.Console(),
  ],
});

logger.info("Application started");
