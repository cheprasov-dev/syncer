import * as crypto from "node:crypto";

import { faker } from "@faker-js/faker";
import * as _ from "lodash";

import { ICustomer } from "./mongodb/schemas/customers.schema";

export function generateRandomString(seed: any, length = 8) {
  let value = seed;

  if (seed === null || seed === undefined) {
    return seed;
  }

  if (typeof seed !== "string") {
    value = JSON.stringify(seed);
  }

  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomString = "";

  const generator = crypto.createHash("sha256").update(value).digest();

  for (let i = 0; i < length; i += 1) {
    const randomIndex = generator[i] % characters.length;
    const randomCharacter = characters.charAt(randomIndex);
    randomString += randomCharacter;
  }

  return randomString;
}

export function createRandomUser(): ICustomer {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    address: {
      line1: faker.location.street(),
      line2: faker.location.street(),
      postcode: faker.location.zipCode(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.county(),
    },
  };
}

export const setValueByKey = _.set;

export const getValueByKey = _.get;

export const getRandom = _.random;

export function encryptCustomer(data: ICustomer): ICustomer {
  const keysToEncrypt = [
    "firstName",
    "lastName",
    "email",
    "address.line1",
    "address.line2",
    "address.postcode",
  ];

  const handlers = {
    email: (value) => {
      if (!value) return value;
      const emailParts = value.split("@");
      const username = emailParts[0];
      const domain = emailParts[1];
      const anonymisedUsername = generateRandomString(username);
      return [anonymisedUsername, domain].join("@");
    },
    default: (value) => generateRandomString(value),
  };

  keysToEncrypt.forEach((key) => {
    const value = getValueByKey(data, key);
    const handler = handlers[key] || handlers.default;
    const anonymisedValue = handler(value);
    setValueByKey(data, key, anonymisedValue);
  });

  return data;
}
