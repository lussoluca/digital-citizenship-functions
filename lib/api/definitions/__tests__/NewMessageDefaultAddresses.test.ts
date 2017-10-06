import {
  isNewMessageDefaultAddresses,
  NewMessageDefaultAddresses,
  toNewMessageDefaultAddresses
} from "../NewMessageDefaultAddresses";

import { toEmailAddress } from "../EmailAddress";

describe("Check NewMessageDefaultAddresses methods", () => {
  test("toNewMessageDefaultAddresses", () => {
    const newMessageDefaultAddressesOne: NewMessageDefaultAddresses = {
      email: toEmailAddress("address@mail.org").get
    };
    const newMessageDefaultAddressesTwo: NewMessageDefaultAddresses = {
      email: "address@"
    };

    expect(
      toNewMessageDefaultAddresses(newMessageDefaultAddressesOne).get
    ).toEqual(newMessageDefaultAddressesOne);
    expect(toNewMessageDefaultAddresses(newMessageDefaultAddressesTwo)).toEqual(
      {}
    );
  });

  test("isNewMessageDefaultAddresses", () => {
    const newMessageDefaultAddressesOne: NewMessageDefaultAddresses = {
      email: toEmailAddress("address@mail.org").get
    };
    const newMessageDefaultAddressesTwo: NewMessageDefaultAddresses = {
      email: "address@"
    };
    const newMessageDefaultAddressesThree: NewMessageDefaultAddresses = {
      email: undefined
    };
    /* tslint:disable */
    const newMessageDefaultAddressesFour: NewMessageDefaultAddresses = {
      email: null
    };
    /* tslint:enable */

    expect(isNewMessageDefaultAddresses(newMessageDefaultAddressesOne)).toBe(
      true
    );
    expect(isNewMessageDefaultAddresses(newMessageDefaultAddressesTwo)).toBe(
      false
    );
    expect(isNewMessageDefaultAddresses(newMessageDefaultAddressesThree)).toBe(
      true
    );
    expect(isNewMessageDefaultAddresses(newMessageDefaultAddressesFour)).toBe(
      true
    );
  });
});