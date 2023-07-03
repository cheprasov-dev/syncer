import RabbitmqAdapter from "./rabbitmq";

class MessagesState {
  adapter: RabbitmqAdapter;

  constructor(adapter) {
    this.adapter = adapter;
  }

  messages = [];

  push(msg) {
    this.messages.push(msg);
  }

  getMessages(count?: number) {
    if (count) {
      return this.messages.splice(0, count);
    }
    return this.messages.splice(0);
  }

  get length() {
    return this.messages.length;
  }
}

export default MessagesState;
