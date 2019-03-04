import { Either, left, right, tryCatch } from "fp-ts/lib/Either";
import { google } from "googleapis";

import { Invitation } from "./types";

// Spreadsheet related columns index and letters.
// The range in A1 notation used to get the values related to an Invitation.
// We are using A2 and not A1 to skip the spreadsheet header row.
const SHEET_RANGE = "A2:U";
// The index of the column of the spreadsheet that must be manually set
// to approve an invitation to be processed.
const APPROVED_COLUMN_INDEX = 19;
// The index of the column where we store that an Invitation has been processed.
const PROCESSED_COLUMN_INDEX = 20;
// The letter in A1 notation where is stored if an Invitation has been processed.
const PROCESSED_COLUMN_LETTER = "U";
// A constant that represent a sucessfull processing
const PROCESSING_SUCCESS = "TRUE";

export function createGoogleClient(
  clientEmail: string,
  key: string,
  spreadsheetId: string,
  betaGroupKey: string,
) {
  // Create the JWT client used for all the APIs
  const jwtClient = new google.auth.JWT({
    email: clientEmail,
    key,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/admin.directory.group",
      "https://www.googleapis.com/auth/admin.directory.group.member",
    ],
  });

  // The API object used to read and manipulate Google Sheets
  const sheets = google.sheets("v4");

  // The API object used to read and manipulate Google Groups Members
  const getGroupMembers = google.admin("directory_v1").members;

  // A function to get the unpreocessed invitations from the google spreadsheet
  async function getUnprocessedInvitations(): Promise<
    Either<Error, ReadonlyArray<Invitation>>
  > {
    try {
      const response = await sheets.spreadsheets.values.get({
        auth: jwtClient,
        spreadsheetId,
        range: SHEET_RANGE,
      });

      const values = response.data.values;

      if (values === undefined) {
        // If there is nothing to process return an empty array
        return right([]);
      }

      // For each row returned check if the invitation must be processed
      const unprocessedInvitations = values.reduce<Invitation[]>(
        (invitations, row, index) => {
          // Transform a spreeadsheet row to an Invitation
          const maybeInvitation = getInvitationFromRow(row, index + 2);
          return maybeInvitation
            .map(_ => {
              // We must only process approved and not already processed Invitations.
              if (_.approved === "TRUE" && _.processed === undefined) {
                return [...invitations, _];
              }
              return invitations;
            })
            .getOrElse(invitations);
        },
        [],
      );

      return right(unprocessedInvitations);
    } catch (e) {
      return left(e);
    }
  }

  // A function to update the Invitation processed status in the spreadsheet.
  async function setInvitationAsProcessed(rowIndex: number) {
    try {
      const response = await sheets.spreadsheets.values.update(
        {
          auth: jwtClient,
          spreadsheetId,
          range: `U${rowIndex}`,
          valueInputOption: "RAW",
          requestBody: {
            range: `${PROCESSED_COLUMN_LETTER}${rowIndex}`,
            values: [[PROCESSING_SUCCESS]],
          },
        },
        {},
      );
      return right(response);
    } catch (e) {
      return left(e);
    }
  }

  /**
   *
   * Adds a member to the beta group.
   *
   * @param email The email of the user you want to add to the beta group
   */
  async function addMemberToBetaGroup(email: string) {
    return tryCatch(
      async () =>
        await getGroupMembers.insert({
          auth: jwtClient,
          groupKey: betaGroupKey,
          requestBody: {
            email,
          },
        }),
    );
  }

  return {
    getUnprocessedInvitations,
    setInvitationAsProcessed,
    addMemberToBetaGroup,
  };
}

// This function is used to transform a spreadsheet row in an Invitation.
function getInvitationFromRow(row: any[], rowIndex: number) {
  // We use io-ts to check if the row data is in the expected format
  const maybeInvitation = Invitation.decode({
    firstName: row[0],
    lastName: row[1],
    email: row[3],
    platform: row[8],
    meta: {
      // We store the rowIndex in the Invitation object so we can use it to update
      // the spreadsheet after the Invitation has been processed.
      rowIndex,
    },
    approved: row[APPROVED_COLUMN_INDEX],
    processed: row[PROCESSED_COLUMN_INDEX],
  });

  return maybeInvitation;
}
