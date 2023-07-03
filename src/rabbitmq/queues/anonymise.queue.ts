import MessagesState from "../../MessagesState";
import { encryptCustomer, parseBuffer } from "../../helpers";
import { CustomerAnonymised } from "../../mongodb";
import { ICustomers } from "../../mongodb/schemas/customers.schema";

import AbstractQueue from "./abstract.queue";

const COUNT = 1000;

class AnonymiseQueue extends AbstractQueue {
  messagesState: MessagesState;

  constructor() {
    super("anonymise-queue");
    this.messagesState = new MessagesState(this.adapter);
  }

  public async send(message): Promise<boolean> {
    return super.send(message);
  }

  public async listening(): Promise<void> {
    await this.receive(async (msg) => {
      try {
        if (this.messagesState.length < COUNT) {
          this.messagesState.push(msg);
          return;
        }

        console.log("messagesState.length", this.messagesState.length);

        const tmp = this.messagesState.getMessages(COUNT);
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
            await this.confirmMessage(tmpMsg);
          })
        );
      } catch (err) {
        console.log("CONSUME_ERROR", err);
        this.adapter.rejectMessage(msg);
      }
    });
  }

  public async confirmMessage(msg) {
    this.adapter.confirmMessage(msg);
  }
}

export default new AnonymiseQueue();
