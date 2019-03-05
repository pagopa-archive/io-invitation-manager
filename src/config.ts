import { Either, left, right } from "fp-ts/lib/Either";
import { fromNullable } from "fp-ts/lib/Option";
import * as t from "io-ts";
import * as iot from "italia-ts-commons";
import { Second } from "italia-ts-commons/lib/units";

const IO_IM_DEFAULT_LOGGER_LEVEL = "info";
const IO_IM_DEFAULT_PROCESSING_INTERVAL_S = 60 * 60;

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
  betaGroupKey: string;
};

export type AppStoreConnectConfig = {
  privateKeyId: string;
  privateKeyPath: string;
  issuerId: string;
  betaGroupId: string;
};

export const loglevel = LogLevel.decode(
  process.env.IO_IM_LOGGER_LEVEL,
).getOrElse(IO_IM_DEFAULT_LOGGER_LEVEL);

export const processIntervalS = iot.numbers.IntegerFromString.decode(
  process.env.IO_IM_PROCESSING_INTERVAL_S,
).getOrElse(IO_IM_DEFAULT_PROCESSING_INTERVAL_S) as Second;

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

  const maybeGoogleBetaGroupKey = fromNullable(
    process.env.IO_IM_GOOGLE_BETA_GROUP_KEY,
  );
  if (maybeGoogleBetaGroupKey.isNone()) {
    return left(Error("You must set IO_IM_GOOGLE_BETA_GROUP_KEY"));
  }
  const googleBetaGroupKey = maybeGoogleBetaGroupKey.value;

  const config: GoogleConfig = {
    clientEmail: googleClientEmail,
    privateKeyPath: googlePrivateKeyPath,
    spreadsheetId: googleSpreadsheetId,
    betaGroupKey: googleBetaGroupKey,
  };

  return right(config);
}

/**
 * Checks that all the required enviroments variables related
 * to the app store connect services are set and returns an error
 * or AppStoreConnectConfig object.
 */
export function loadAppStoreConnectConfig(): Either<
  Error,
  AppStoreConnectConfig
> {
  const maybeAppStoreConnectPrivateKeyId = fromNullable(
    process.env.IO_IM_APP_STORE_CONNECT_PRIVATE_KEY_ID,
  );
  if (maybeAppStoreConnectPrivateKeyId.isNone()) {
    return left(Error("You must set IO_IM_APP_STORE_CONNECT_PRIVATE_KEY_ID"));
  }
  const appStoreConnectPrivateKeyId = maybeAppStoreConnectPrivateKeyId.value;

  const maybeAppStoreConnectPrivateKeyPath = fromNullable(
    process.env.IO_IM_APP_STORE_CONNECT_PRIVATE_KEY_PATH,
  );
  if (maybeAppStoreConnectPrivateKeyPath.isNone()) {
    return left(Error("You must set IO_IM_APP_STORE_CONNECT_PRIVATE_KEY_PATH"));
  }
  const appStoreConnectPrivateKeyPath =
    maybeAppStoreConnectPrivateKeyPath.value;

  const maybeAppStoreConnectIssuerId = fromNullable(
    process.env.IO_IM_APP_STORE_CONNECT_ISSUER_ID,
  );
  if (maybeAppStoreConnectIssuerId.isNone()) {
    return left(Error("You must set IO_IM_APP_STORE_CONNECT_ISSUER_ID"));
  }
  const appStoreConnectIssuerId = maybeAppStoreConnectIssuerId.value;

  const maybeAppStoreConnectBetaGroupId = fromNullable(
    process.env.IO_IM_APP_STORE_CONNECT_BETA_GROUP_ID,
  );
  if (maybeAppStoreConnectBetaGroupId.isNone()) {
    return left(Error("You must set IO_IM_APP_STORE_CONNECT_BETA_GROUP_ID"));
  }
  const appStoreConnectBetaGroupId = maybeAppStoreConnectBetaGroupId.value;

  const config: AppStoreConnectConfig = {
    privateKeyId: appStoreConnectPrivateKeyId,
    privateKeyPath: appStoreConnectPrivateKeyPath,
    issuerId: appStoreConnectIssuerId,
    betaGroupId: appStoreConnectBetaGroupId,
  };

  return right(config);
}
