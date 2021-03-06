import * as t from "io-ts";

import { NonEmptyString } from "../utils/strings";

import { MessageContent } from "../api/definitions/MessageContent";

import { CreatedMessageEventSenderMetadata } from "./created_message_sender_metadata";

/**
 * Payload of a notification event.
 *
 * This event gets triggered on new notifications to the channels that
 * have been configured for that notification.
 */
export const NotificationEvent = t.interface({
  messageContent: MessageContent,
  messageId: NonEmptyString,
  notificationId: NonEmptyString,
  senderMetadata: CreatedMessageEventSenderMetadata
});

export type NotificationEvent = t.TypeOf<typeof NotificationEvent>;
