import { EventEmitter } from "events";

import { Types } from "mongoose";

import messagesState from "./MessagesState";
import { encryptCustomer } from "./helpers";
import {
  connect,
  Customer,
  CustomerAnonymised,
  execTransaction,
  State,
} from "./mongodb";
import { ICustomer } from "./mongodb/schemas/customers.schema";
import { IState } from "./mongodb/schemas/state.schema";

const LIMIT = 100;
const UPDATE_EVENT = "update_event";
const eventEmitter = new EventEmitter();

async function reindexCustomers(starPosition?: Types.ObjectId, skip = 0) {
  const customers = await Customer.find<ICustomer>({
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

async function syncChunkCustomers(initiator, count?: number) {
  const messages = await messagesState.getMessages(count);
  console.log(
    `${initiator}:`,
    `chunk ${messages.length}`,
    "|",
    messagesState.length
  );
  if (messages.length) {
    await execTransaction(async (session) => {
      const preparedData: { customers: object[]; states: IState[] } =
        messages.reduce(
          (acc, elem) => {
            acc.customers.push(elem.fullDocument);
            acc.states.push({ resumeToken: elem._id });
            return acc;
          },
          {
            customers: [],
            states: [],
          }
        );

      await CustomerAnonymised.create(preparedData.customers, { session });
      await State.create(preparedData.states, { session });
    });

    console.log(`updated ${messages.length}`);
  }
}

async function onChangeWatchEvent(change) {
  change.fullDocument = encryptCustomer(change.fullDocument);
  await messagesState.push(change);
  console.log("messagesState length", messagesState.length);
  if (messagesState.length === LIMIT) {
    console.log("send event", UPDATE_EVENT, "limit", LIMIT);

    eventEmitter.emit(UPDATE_EVENT, "max length", LIMIT);
  }
}

export async function sync() {
  if (process.argv.includes("--full-reindex")) {
    console.log("Full-reindex mode started");

    await reindexCustomers();

    console.log("Reindex completed");
    process.exit(0);
  } else {
    console.log("Sinc mode started");

    eventEmitter.on(UPDATE_EVENT, syncChunkCustomers);

    const lastState = await State.findOne({}).sort({ _id: -1 }).exec();

    const changeStream = Customer.watch(
      [{ $match: { operationType: "insert" } }],
      { ...(lastState && { resumeAfter: lastState?.resumeToken }) }
    );

    changeStream.on("change", onChangeWatchEvent);

    setInterval(() => {
      eventEmitter.emit(UPDATE_EVENT, "timer");
    }, 1000);
  }
}

connect().then(sync).catch(console.log);
