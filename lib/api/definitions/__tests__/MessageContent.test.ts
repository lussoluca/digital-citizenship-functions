import { MessageSubject, toMessageSubject } from "../MessageSubject";

import {
  MessageBodyMarkdown,
  toMessageBodyMarkdown
} from "../MessageBodyMarkdown";

import {
  isMessageContent,
  MessageContent,
  toMessageContent
} from "../MessageContent";

describe("Check MessageContent type", () => {
  test("toMessageContent", () => {
    const s: MessageSubject = toMessageSubject("Lorem ipsum dolor sit amet")
      .get;
    const m: MessageBodyMarkdown = toMessageBodyMarkdown(
      // String long 90 characters.
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt"
    ).get;

    const messageContent: MessageContent = {
      markdown: m,
      subject: s
    };

    expect(toMessageContent(messageContent).get).toEqual(messageContent);
  });

  test("isMessageContent", () => {
    const s: MessageSubject = toMessageSubject("Lorem ipsum dolor sit amet")
      .get;
    const m: MessageBodyMarkdown = toMessageBodyMarkdown(
      // String long 90 characters.
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt"
    ).get;

    const messageContent: MessageContent = {
      markdown: m,
      subject: s
    };

    expect(isMessageContent(messageContent)).toBe(true);
  });

  test("isMessageContent, check markdown property", () => {
    const s: MessageSubject = toMessageSubject("Lorem ipsum dolor sit amet")
      .get;
    const m: MessageBodyMarkdown = "Lorem ipsum dolor sit amet";

    const messageContentOne: MessageContent = {
      markdown: m,
      subject: s
    };
    expect(isMessageContent(messageContentOne)).toBe(false);

    const messageContentTwo: MessageContent = {
      subject: s
    };
    expect(isMessageContent(messageContentTwo)).toBe(false);
  });

  test("isMessageContent, check subject property", () => {
    const s: MessageSubject = "Lorem";
    const m: MessageBodyMarkdown = toMessageBodyMarkdown(
      // String long 90 characters.
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt"
    ).get;

    const messageContentOne: MessageContent = {
      markdown: m,
      subject: s
    };
    expect(isMessageContent(messageContentOne)).toBe(false);

    const messageContentTwo: MessageContent = {
      markdown: m
    };
    expect(isMessageContent(messageContentTwo)).toBe(true);

    /* tslint:disable */
    const messageContentThree: MessageContent = {
      markdown: m,
      subject: null
    };
    /* tslint:enable */
    expect(isMessageContent(messageContentThree)).toBe(true);
  });
});
