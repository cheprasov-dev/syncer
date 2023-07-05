import { Mutex } from "async-mutex";

class MessagesState {
  private messages = [];

  private mutex = new Mutex();

  async push(msg) {
    await this.mutex.runExclusive(async () => {
      this.messages.push(msg);
    });
  }

  async getMessages(count?: number) {
    return this.mutex.runExclusive(async () => {
      if (count) {
        return this.messages.splice(0, count);
      }
      return this.messages.splice(0);
    });
  }

  get length() {
    return this.messages.length;
  }
}

export default new MessagesState();
