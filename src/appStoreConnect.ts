import { v1 } from "appstoreconnect";
import { left, right } from "fp-ts/lib/Either";

export function createAppStoreConnectClient(
  keyId: string,
  privateKey: string,
  issuerId: string,
  betaGroupId: string,
) {
  // Create a JWT token used for the API requests
  const token = v1.token(privateKey, issuerId, keyId);
  // Create the API object
  const api = v1(token);

  // Adds a member to the beta group
  async function addMemberToBetaGroup(
    email: string,
    firstName: string,
    lastName: string,
  ) {
    try {
      const result = await v1.testflight.createBetaTester(api, {
        data: {
          attributes: {
            email,
            firstName,
            lastName,
          },
          relationships: {
            betaGroups: {
              data: [
                {
                  id: betaGroupId,
                  type: "betaGroups",
                },
              ],
            },
          },
          type: "betaTesters",
        },
      });
      return right(result);
    } catch (e) {
      return left(e);
    }
  }

  return {
    addMemberToBetaGroup,
  };
}
