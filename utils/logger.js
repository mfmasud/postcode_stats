const winston = require("winston");
const { format } = require("logform");

const logger = winston.createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({
      format: "DD-MM-YYYY HH:mm:ss",
    }),
    format.colorize({ level: true, colors: { info: "blue", error: "red" } }),
    format.errors({ stack: true }),
    format.align(),
    format.json()
  ),
  defaultMeta: { service: "log-service" },
  transports: [
    // - Write all logs to console window
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    //new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

module.exports = logger;
