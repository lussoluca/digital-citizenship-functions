import {
  isNotificationChannelStatus,
  toNotificationChannelStatus
} from "../NotificationChannelStatus";

describe("NotificationChannelStatus#toNotificationChannelStatus", () => {
  it("should returns a defined option for valid notification channel status", () => {
    const notificationChannelStatusOne: string = "QUEUED";
    expect(
      toNotificationChannelStatus(notificationChannelStatusOne).get
    ).toEqual(notificationChannelStatusOne);
  });
  it("should returns an empty option for invalid notification channel status", () => {
    const notificationChannelStatusTwo: string = "WRONG";
    expect(toNotificationChannelStatus(notificationChannelStatusTwo)).toEqual(
      {}
    );
  });
});

describe("NotificationChannelStatus#isNotificationChannelStatus", () => {
  it("should returns true if NotificationChannelStatus is well formed", () => {
    const notificationChannelStatusOne: string = "QUEUED";
    expect(isNotificationChannelStatus(notificationChannelStatusOne)).toBe(
      true
    );
  });
  it("should returns true if NotificationChannelStatus is malformed", () => {
    const notificationChannelStatusTwo: string = "WRONG";
    expect(isNotificationChannelStatus(notificationChannelStatusTwo)).toBe(
      false
    );
  });
});