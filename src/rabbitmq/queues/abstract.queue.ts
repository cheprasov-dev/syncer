import { stringifyBuffer } from "../../helpers";
import RabbitmqAdapter from "../index";

abstract class AbstractQueue {
  protected readonly adapter: RabbitmqAdapter = new RabbitmqAdapter();

  protected readonly queue: string;

  protected constructor(queue) {
    this.queue = queue;
    this.init();
  }

  protected async init(): Promise<void> {
    await this.adapter.init();
    await this.adapter.channel.assertQueue(this.queue);
  }

  protected async send(message): Promise<boolean> {
    if (!this.adapter?.channel) {
      await this.init();
    }
    const messageBuffer = stringifyBuffer(message);
    return this.adapter.channel.sendToQueue(this.queue, messageBuffer);
  }

  protected async receive(onMessage, noAck = false): Promise<void> {
    if (!this.adapter?.channel) {
      await this.init();
    }
    await this.adapter.channel.consume(this.queue, onMessage, { noAck });
  }
}

export default AbstractQueue;
