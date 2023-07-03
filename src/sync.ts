import { Types } from "mongoose";

import { encryptCustomer, parseBuffer } from "./helpers";
import { connect, Customer, CustomerAnonymised } from "./mongodb";
import { ICustomers } from "./mongodb/schemas/customers.schema";
import anonymiseQueue from "./rabbitmq/queues/anonymise.queue";

const LIMIT = 1000;

async function reindexCustomers(starPosition?: Types.ObjectId, skip = 0) {
  const customers = await Customer.find<ICustomers>({
    ...(starPosition && { _id: { $gte: starPosition } }),
  })
    .sort({ _id: 1 })
    .skip(skip * LIMIT)
    .limit(LIMIT)
    .lean()
    .exec();

  if (!customers.length) {
    return null;
  }

  console.log(`chunk ${skip + 1}. Data: ${customers.length}`);

  const bulkOps = customers.map((data) => ({
    updateOne: {
      filter: { _id: data._id },
      update: { $set: encryptCustomer(data) },
      upsert: true,
    },
  }));

  await CustomerAnonymised.bulkWrite(bulkOps);

  return reindexCustomers(starPosition, skip + 1);
}

export async function sync() {
  if (process.argv.includes("--full-reindex")) {
    console.log("Full-reindex mode started");
    await reindexCustomers();
    console.log("Reindex completed");
    process.exit(0);
  } else {
    console.log("Sinc mode started");

    await anonymiseQueue.listening();

    setInterval(async () => {
      const tmp = anonymiseQueue.messagesState.getMessages();
      console.log("interval tmp.length", tmp.length);

      await Promise.all(
        tmp.map(async (tmpMsg) => {
          const parsed = parseBuffer<ICustomers>(tmpMsg.content);
          const encryptedCustomersData = encryptCustomer(parsed);
          try {
            await CustomerAnonymised.create(encryptedCustomersData);
          } catch (err) {
            if (err.code !== 11000) {
              throw err;
            }
          }
          await anonymiseQueue.confirmMessage(tmpMsg);
        })
      );
    }, 1000);
  }
}

connect().then(sync);
