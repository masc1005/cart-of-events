import express, { json } from "express";
import cors from "cors";

import routes from "./routes";
import { RabbitMQ } from "./config/rabbitmq";
import eventServices from "../src/app/services/eventServices";

const server = express();

server.use(cors());
server.use(express.json());
server.use(routes);

server.listen(process.env.SERVER_PORT, async () => {
  console.log("Server is running");

  const rabbitmq = new RabbitMQ("amqp://admin:admin@localhost:5672");
  await rabbitmq.connect();

  await rabbitmq.consume("getEvents", async (msg) => {
    const event = await eventServices.getEventById(
      JSON.parse(msg.content.toString())
    );

    await rabbitmq.createQueue("returnEvent");
    await rabbitmq.sendToQueue("returnEvent", JSON.stringify(event));

    await rabbitmq.consume("syncEventQuantity", async (msg) => {
      await eventServices.updateEvent(JSON.parse(msg.content.toString()));
    });
  });
});
