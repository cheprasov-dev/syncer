import * as amqplib from "amqplib";
import { Channel, Connection, Message } from "amqplib";

import {
  RABBIT_HOST,
  RABBIT_PASSWORD,
  RABBIT_PORT,
  RABBIT_USER,
} from "../config";

class RabbitMQ {
  private conn: Connection;

  public channel: Channel;

  private user: string = RABBIT_USER || "username";

  private password: string = RABBIT_PASSWORD || "password";

  private host: string = RABBIT_HOST || "localhost";

  private port: number = RABBIT_PORT || 5672;

  private vhost = "";

  public async init(): Promise<void> {
    await this.connect();
  }

  private async connect(): Promise<void> {
    try {
      console.log("RABBIT_CONNECT_START");

      this.conn = await amqplib.connect({
        port: this.port,
        vhost: this.vhost,
        hostname: this.host,
        username: this.user,
        password: this.password,
      });

      console.log("RABBIT_CONNECTED");

      this.channel = await this.conn.createChannel();
      console.log("RABBIT_CHANNEL_CREATE");
    } catch (err) {
      console.log("RABBIT_CONNECT_ERROR", err);
    }
  }

  public confirmMessage(msg: Message): void {
    this.channel.ack(msg);
  }

  public rejectMessage(msg: Message): void {
    this.channel.nack(msg);
  }

  public async destroy(): Promise<void> {
    await this.conn.close();
  }
}

export default RabbitMQ;
