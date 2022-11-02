import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import routes from "./routes";
import authService from "./app/services/authService";
import { RabbitMQ } from "./config/rabbitmq";

const server = express();

dotenv.config();

server.use(cors());
server.use(express.json());
server.use(routes);

server.listen(process.env.SERVER_PORT, async () => {
  console.log("Server running on port 3333");

  const rabbitmq = new RabbitMQ("amqp://admin:admin@localhost:5672");
  await rabbitmq.connect();

  await rabbitmq.consume("isAuth", async (msg) => {
    const authResponse = await authService(msg.content.toString());

    await rabbitmq.createQueue("authResponse");
    await rabbitmq.sendToQueue("authResponse", JSON.stringify(authResponse));
  });
});
