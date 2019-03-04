import { createLogger, format, transports } from "winston";

import { loadGoogleConfig, loglevel } from "./config";
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
) {
  logger.info("Retriving unprocessed invitations");
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
    // TODO: Add real invitation processing

    // Update the invitation status in the Spreadsheet
    const resultOrError = await googleClient.setInvitationAsProcessed(
      invitation.meta.rowIndex,
    );

    if (resultOrError.isLeft()) {
      logger.error(resultOrError.value);
    }
  });
}

// The main application function
function startService() {
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
  );

  // TODO: Define a better way to handle the loop.
  // Move the interval to an enviroment variable.
  setInterval(() => startProcessing(googleClient).then(() => 0), 5000);
}

startService();
