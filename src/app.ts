import { faker } from "@faker-js/faker";

import { createRandomUser, getRandom } from "./helpers";
import { connect, Customer } from "./mongodb";
import { ICustomers } from "./mongodb/schemas/customers.schema";
import anonymiseQueue from "./rabbitmq/queues/anonymise.queue";

const MAX_COUNT = 10;

export async function app() {
  console.log("App started");
  setInterval(async () => {
    const random = getRandom(1, MAX_COUNT);
    const customers: ICustomers[] = faker.helpers.multiple(createRandomUser, {
      count: random,
    });
    const newCustomers = await Customer.create(customers);

    newCustomers.map((customer) => anonymiseQueue.send(customer));

    console.log(`${customers.length} elems added`);
  }, 200);
}

connect().then(app);
