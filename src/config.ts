import { Either, left, right } from "fp-ts/lib/Either";
import { fromNullable } from "fp-ts/lib/Option";
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

export type LogLevel = t.TypeOf<typeof LogLevel>;

export type GoogleConfig = {
  clientEmail: string;
  privateKeyPath: string;
  spreadsheetId: string;
};

export const loglevel = LogLevel.decode(
  process.env.IO_IM_LOGGER_LEVEL,
).getOrElse(IO_IM_DEFAULT_LOGGER_LEVEL);

/**
 * A function that checks that all the required enviroments variables related
 * to the google services are set and returns an error or GoogleConfig object.
 */
export function loadGoogleConfig(): Either<Error, GoogleConfig> {
  const maybeGoogleClientEmail = fromNullable(
    process.env.IO_IM_GOOGLE_CLIENT_EMAIL,
  );
  if (maybeGoogleClientEmail.isNone()) {
    return left(Error("You must set IO_IM_GOOGLE_CLIENT_EMAIL"));
  }
  const googleClientEmail = maybeGoogleClientEmail.value;

  const maybeGooglePrivateKeyPath = fromNullable(
    process.env.IO_IM_GOOGLE_PRIVATE_KEY_PATH,
  );
  if (maybeGooglePrivateKeyPath.isNone()) {
    return left(Error("You must set IO_IM_GOOGLE_PRIVATE_KEY_PATH"));
  }
  const googlePrivateKeyPath = maybeGooglePrivateKeyPath.value;

  const maybeGoogleSpreadsheetId = fromNullable(
    process.env.IO_IM_GOOGLE_SPREADSHEET_ID,
  );
  if (maybeGoogleSpreadsheetId.isNone()) {
    return left(Error("You must set IO_IM_GOOGLE_SPREADSHEET_ID"));
  }
  const googleSpreadsheetId = maybeGoogleSpreadsheetId.value;

  const config: GoogleConfig = {
    clientEmail: googleClientEmail,
    privateKeyPath: googlePrivateKeyPath,
    spreadsheetId: googleSpreadsheetId,
  };

  return right(config);
}
