import * as t from "io-ts";

export const InvitationRequired = t.type({
  firstName: t.string,
  lastName: t.string,
  email: t.string,
  platform: t.union([t.literal("Android"), t.literal("iOS")]),
  meta: t.type({
    rowIndex: t.number,
  }),
});

export const InvitationOptional = t.partial({
  approved: t.literal("TRUE"),
  processed: t.literal("TRUE"),
});

export const Invitation = t.intersection([
  InvitationRequired,
  InvitationOptional,
]);

export type Invitation = t.TypeOf<typeof Invitation>;
