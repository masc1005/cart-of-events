import { Request, Response } from "express";
import { RabbitMQ } from "../../config/rabbitmq";

import eventRepository from "../repository/eventRespository";

class EventController {
  // Create event
  async create(request: Request, response: Response) {
    const data = request.body;
    const auth = request.headers.authorization;

    if (!auth) {
      return response.status(401).json({ error: "Unauthorized" });
    }

    const rabbitmq = new RabbitMQ("amqp://admin:admin@localhost:5672");
    await rabbitmq.connect();
    await rabbitmq.createQueue("isAuth");
    await rabbitmq.sendToQueue("isAuth", auth);

    await rabbitmq.consume("authResponse", async (msg) => {
      let authResponse = JSON.parse(msg.content.toString());

      if (authResponse.role !== "admin") {
        console.log(authResponse.role);
        return response.status(401).json({ error: "Unauthorized" });
      }

      const eventExists = await eventRepository.getEventsByNames(data);

      if (eventExists) {
        return response.status(400).json({ error: "Event already exists" });
      }

      const event = await eventRepository.createEvent(data);

      return response.json(event);
    });

    await rabbitmq.close();
  }

  // Get all events
  async show(request: Request, response: Response) {
    const auth = request.headers.authorization;

    const rabbitmq = new RabbitMQ("amqp://admin:admin@localhost:5672");
    await rabbitmq.connect();
    await rabbitmq.createQueue("isAuth");
    await rabbitmq.sendToQueue("isAuth", auth);

    await rabbitmq.consume("authResponse", async (msg) => {
      try {
        let authResponse = JSON.parse(msg?.content?.toString());

        if (!authResponse) {
          return response.status(401).json({ error: "Unauthorized" }).end();
        }

        const event = await eventRepository.getEvents();

        return response.json(event);
      } catch (error) {
        console.log(error);
      }
    });

    await rabbitmq.close();
  }

  // Update event
  async update(request: Request, response: Response) {
    const data = request.body;
    const auth = request.headers.authorization;

    if (!auth) {
      return response.status(401).json({ error: "Unauthorized" });
    }

    const rabbitmq = new RabbitMQ("amqp://admin:admin@localhost:5672");
    await rabbitmq.connect();
    await rabbitmq.createQueue("isAuth");
    await rabbitmq.sendToQueue("isAuth", auth);

    await rabbitmq.consume("authResponse", async (msg) => {
      let authResponse = JSON.parse(msg.content.toString());

      if (authResponse.role !== "admin") {
        console.log(authResponse.role);
        return response.status(401).json({ error: "Unauthorized" });
      }

      const eventExists = await eventRepository.getEventById(data);

      if (!eventExists) {
        return response.status(400).json({ error: "Event does not exists" });
      }

      const event = await eventRepository.updateEvent(data);
      return response.json(event);
    });

    await rabbitmq.close();
  }

  // Delete event
  async delete(request: Request, response: Response) {
    const data = request.body;
    const auth = request.headers.authorization;

    if (!auth) {
      return response.status(401).json({ error: "Unauthorized" });
    }

    const rabbitmq = new RabbitMQ("amqp://admin:admin@localhost:5672");
    await rabbitmq.connect();
    await rabbitmq.createQueue("isAuth");
    await rabbitmq.sendToQueue("isAuth", auth);

    await rabbitmq.consume("authResponse", async (msg) => {
      let authResponse = JSON.parse(msg.content.toString());
      if (authResponse.role !== "admin") {
        console.log(authResponse.role);
        return response.status(401).json({ error: "Unauthorized" });
      }

      const eventExists = await eventRepository.getEventById(data);

      if (!eventExists) {
        return response.status(400).json({ error: "Event does not exists" });
      }

      await eventRepository.deleteEvent(data);

      return response.json({ message: "Event deleted" });
    });

    await rabbitmq.close();
  }
}

export default new EventController();
