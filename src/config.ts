import * as t from "io-ts";

const IO_IM_DEFAULT_LOGGER_LEVEL = "info";

const LogLevel = t.union([
  t.literal("error"),
  t.literal("warn"),
  t.literal("info"),
  t.literal("http"),
  t.literal("verbose"),
  t.literal("debug"),
  t.literal("silly"),
]);

type LogLevel = t.TypeOf<typeof LogLevel>;

export const logLevel = LogLevel.decode(
  process.env.IO_IM_LOGGER_LEVEL,
).getOrElse(IO_IM_DEFAULT_LOGGER_LEVEL);
