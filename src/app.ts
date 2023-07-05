import { faker } from "@faker-js/faker";

import { createRandomUser, getRandom } from "./helpers";
import { connect, Customer } from "./mongodb";
import { ICustomer } from "./mongodb/schemas/customers.schema";

const MAX_COUNT = 20;

export async function app() {
  console.log("App started");
  setInterval(async () => {
    const random = getRandom(1, MAX_COUNT);
    const customers: ICustomer[] = faker.helpers.multiple(createRandomUser, {
      count: random,
    });
    await Customer.create(customers);

    console.log(`${customers.length} elems added`);
  }, 200);
}

connect().then(app);
