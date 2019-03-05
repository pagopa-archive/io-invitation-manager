import * as iot from "italia-ts-commons";
import { Millisecond } from "italia-ts-commons/lib/units";
import { createLogger, format, transports } from "winston";

import { createAppStoreConnectClient } from "./appStoreConnect";
import {
  loadAppStoreConnectConfig,
  loadGoogleConfig,
  loglevel,
  processIntervalS,
} from "./config";
import { createGoogleClient } from "./google";
import { loadPrivateKey } from "./utils";

const app = {
  name: "io-invitaition-manager",
};

const logger = createLogger({
  level: loglevel,
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

// The core function that start the processing of the Invitations.
async function startProcessing(
  googleClient: ReturnType<typeof createGoogleClient>,
  appStoreConnectClient: ReturnType<typeof createAppStoreConnectClient>,
) {
  logger.info("Retreiving unprocessed invitations");
  // Get the unprocessed invitations reading the google spreadsheet
  const unprocessedInvitationsOrError = await googleClient.getUnprocessedInvitations();
  if (unprocessedInvitationsOrError.isLeft()) {
    logger.error(unprocessedInvitationsOrError.value);
    return;
  }

  const unprocessedInvitations = unprocessedInvitationsOrError.value;

  logger.info(
    `We need to process ${unprocessedInvitations.length} invitations`,
  );

  // For each unprocessed invitation check the platform (Android/iOS)
  // and use the corresponding api to add the invitation email to the
  // beta group.
  unprocessedInvitations.forEach(async invitation => {
    // Check the Invitation platform (Android/iOS)
    const platform = invitation.platform;

    // Call the API to add the user to the beta group
    const addMemberToBetaGroupOrError =
      (await platform) === "Android"
        ? await googleClient.addMemberToBetaGroup(invitation.email)
        : await appStoreConnectClient.addMemberToBetaGroup(
            invitation.email,
            invitation.firstName,
            invitation.lastName,
          );

    if (addMemberToBetaGroupOrError.isLeft()) {
      logger.error(
        `Error adding ${
          invitation.email
        } to the beta group of ${platform} platform.`,
      );
      logger.error(addMemberToBetaGroupOrError.value.message);
    } else {
      logger.info(
        `Successfully added ${
          invitation.email
        } to the beta group of ${platform} platform.`,
      );
    }

    // TODO: Add the error to the spreadsheet
    // Update the Invitation status in the Spreadsheet
    const resultOrError = await googleClient.setInvitationAsProcessed(
      invitation.meta.rowIndex,
      addMemberToBetaGroupOrError.isLeft()
        ? addMemberToBetaGroupOrError.value.message
        : undefined,
    );

    if (resultOrError.isLeft()) {
      logger.error(resultOrError.value);
    }
  });
}

// The main application function
async function startService() {
  logger.info("Service started");

  // Load the google configuration
  logger.info("Loading Google configuration");
  const googleConfigOrError = loadGoogleConfig();
  if (googleConfigOrError.isLeft()) {
    // An error occured while loading the required configuration.
    // Log the error and exit.
    logger.error(googleConfigOrError.value);
    process.exit(1);
    return;
  }

  const {
    clientEmail,
    privateKeyPath: googlePrivateKeyPath,
    spreadsheetId,
    betaGroupKey,
  } = googleConfigOrError.value;

  // Load the private key from file
  const maybeGooglePrivateKey = loadPrivateKey(googlePrivateKeyPath);
  if (maybeGooglePrivateKey.isNone()) {
    // Cant read the private kay so log and exit
    logger.error("Can't read Google private key");
    process.exit(1);
    return;
  }

  // Crete the google client
  const googleClient = createGoogleClient(
    clientEmail,
    maybeGooglePrivateKey.value,
    spreadsheetId,
    betaGroupKey,
  );

  // Load the app store connect configuration
  const appStoreConnectConfigOrError = loadAppStoreConnectConfig();
  if (appStoreConnectConfigOrError.isLeft()) {
    // An error occured while loading the required configuration.
    // Log the error and exit.
    logger.error(appStoreConnectConfigOrError.value);
    process.exit(1);
    return;
  }

  const {
    privateKeyId,
    privateKeyPath: appStoreConnectPrivateKeyPath,
    issuerId,
    betaGroupId,
  } = appStoreConnectConfigOrError.value;

  // Load the private key from file
  const maybeAppStoreConnectPrivateKey = loadPrivateKey(
    appStoreConnectPrivateKeyPath,
  );
  if (maybeAppStoreConnectPrivateKey.isNone()) {
    // Cant read the private kay so log and exit
    logger.error("Can't read AppStore Connect private key");
    process.exit(1);
    return;
  }

  const appStoreConnectClient = createAppStoreConnectClient(
    privateKeyId,
    maybeAppStoreConnectPrivateKey.value,
    issuerId,
    betaGroupId,
  );

  while (true) {
    await startProcessing(googleClient, appStoreConnectClient);
    logger.info(`Waiting ${processIntervalS} seconds before next processing.`);
    await iot.promises.timeoutPromise((processIntervalS * 1000) as Millisecond);
  }
}

startService().then(() => 0);
