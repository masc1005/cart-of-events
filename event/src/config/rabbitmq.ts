import { Channel, Connection, connect, Message } from "amqplib";

export class RabbitMQ {
  private connection: Connection;
  private channel: Channel;

  constructor(private uri: string) {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    this.connection = await connect(this.uri);
    this.channel = await this.connection.createChannel();
  }

  async createQueue(queue: string) {
    await this.channel.assertQueue(queue, { durable: true });
  }

  async sendToQueue(queue: string, message: string) {
    await this.channel.sendToQueue(queue, Buffer.from(message), {
      persistent: true,
    });
  }

  async consume(queue: string, callback: (msg: Message) => void) {
    await this.channel.consume(queue, callback, { noAck: true });
  }

  async close() {
    await this.connection.close();
  }
}
