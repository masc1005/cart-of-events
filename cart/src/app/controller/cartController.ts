import { Request, Response } from "express";
import CartRepository from "../repository/cartRepository";

import { RabbitMQ } from "../../config/rabbitmq";

class CartController {
  async createCart(request: Request, response: Response) {
    const data = request.body;
    const auth = request.headers.authorization;

    const rabbitmq = new RabbitMQ("amqp://admin:admin@localhost:5672");
    await rabbitmq.connect();
    await rabbitmq.createQueue("isAuth");
    await rabbitmq.sendToQueue("isAuth", auth);

    await rabbitmq.consume("authResponse", async (msg) => {
      let authResponse = JSON.parse(msg.content.toString());

      if (!authResponse) {
        return response.status(401).json({ error: "Unauthorized" });
      }

      const cartActive = await CartRepository.getCartByUserId(authResponse.id);

      if (cartActive) {
        return response.status(400).json({ error: "Cart already exists" });
      }

      await rabbitmq.createQueue("getEvents");
      await rabbitmq.sendToQueue("getEvents", JSON.stringify(data));

      await rabbitmq.consume("returnEvent", async (msg) => {
        let eventInfo = JSON.parse(msg.content.toString());

        if (!eventInfo) {
          return response.status(400).json({ error: "Event does not exists" });
        }

        if (eventInfo.isEnoughTickets < data.quantity) {
          return response.status(400).json({
            error: `Event does not have enough tickets, we have only: ${
              eventInfo.quantity + data.quantity
            }`,
          });
        }

        await rabbitmq.createQueue("syncEventQuantity");
        await rabbitmq.sendToQueue(
          "syncEventQuantity",
          JSON.stringify({
            id: data.eventId,
            quantity: eventInfo.event.quantity - data.quantity,
          })
        );

        const cart = await CartRepository.create(
          data,
          eventInfo.event,
          authResponse.id
        );

        return response.status(200).json(cart);
      });
    });
    await rabbitmq.close();
    setTimeout(async () => {}, 100);
  }

  async getCartByUserId(request: Request, response: Response) {
    const auth = request.headers.authorization;

    const rabbitmq = new RabbitMQ("amqp://admin:admin@localhost:5672");
    await rabbitmq.connect();
    await rabbitmq.createQueue("isAuth");
    await rabbitmq.sendToQueue("isAuth", auth);

    await rabbitmq.consume("authResponse", async (msg) => {
      let authResponse = JSON.parse(msg.content.toString());
      const cart = await CartRepository.getCartByUserId(authResponse.id);

      if (!cart) {
        return response.status(400).json({ error: "Cart does not exists" });
      }

      return response.status(200).json(cart);
    });

    await rabbitmq.close();
  }

  async addEventToCart(request: Request, response: Response) {
    const data = request.body;
    const auth = request.headers.authorization;

    const rabbitmq = new RabbitMQ("amqp://admin:admin@localhost:5672");
    await rabbitmq.connect();
    await rabbitmq.createQueue("isAuth");
    await rabbitmq.sendToQueue("isAuth", auth);

    await rabbitmq.consume("authResponse", async (msg) => {
      let authResponse = JSON.parse(msg.content.toString());
      if (!authResponse) {
        return response.status(401).json({ error: "Unauthorized" });
      }

      const cartExists = await CartRepository.getCartByUserId(authResponse.id);

      if (!cartExists) {
        return response.status(400).json({ error: "Cart does not exists" });
      }

      await rabbitmq.createQueue("getEvents");
      await rabbitmq.sendToQueue(
        "getEvents",
        JSON.stringify({ id: data.eventId, quantity: data.quantity })
      );

      await rabbitmq.consume("returnEvent", async (msg) => {
        let eventInfo = JSON.parse(msg.content.toString());

        if (!eventInfo) {
          return response.status(400).json({ error: "Event does not exists" });
        }

        if (eventInfo.isEnoughTickets < data.quantity) {
          return response.status(400).json({
            error: `Event does not have enough tickets, we have only: ${
              eventInfo.quantity + data.quantity
            }`,
          });
        }

        await rabbitmq.createQueue("syncEventQuantity");
        await rabbitmq.sendToQueue(
          "syncEventQuantity",
          JSON.stringify({
            id: data.eventId,
            quantity: eventInfo.event.quantity - data.quantity,
          })
        );

        const total =
          cartExists.itens
            .map((item) => {
              return item["price"] * item["quantity"];
            })
            .reduce((a, b) => a + b, 0) +
          eventInfo.event.price * data.quantity.toFixed(2);

        const cart = await CartRepository.addEventToCart(
          data,
          eventInfo.event,
          authResponse.id,
          total
        );

        return response.status(200).json(cart);
      });

      setTimeout(async () => {
        await rabbitmq.close();
      }, 100);
    });
  }

  async removeEventFromCart(request: Request, response: Response) {
    const data = request.body;
    const auth = request.headers.authorization;

    const rabbitmq = new RabbitMQ("amqp://admin:admin@localhost:5672");
    await rabbitmq.connect();
    await rabbitmq.createQueue("isAuth");
    await rabbitmq.sendToQueue("isAuth", auth);

    await rabbitmq.consume("authResponse", async (msg) => {
      let authResponse = JSON.parse(msg.content.toString());
      let toInsert;
      if (!authResponse) {
        return response.status(401).json({ error: "Unauthorized" });
      }

      const cartExists = await CartRepository.getCartByUserId(authResponse.id);

      if (!cartExists) {
        return response.status(400).json({ error: "Cart does not exists" });
      }

      const update = cartExists.itens.filter((event) => {
        if (event["id"] === data.eventId) {
          toInsert = { id: event["id"], quantity: event["quantity"] };
          event = null;
        }

        return event;
      });

      if (!toInsert) {
        return response
          .status(400)
          .json({ error: "Event does not exists in this cart" });
      }

      await rabbitmq.createQueue("getEvents");
      await rabbitmq.sendToQueue(
        "getEvents",
        JSON.stringify({ id: toInsert["id"] })
      );

      await rabbitmq.consume("returnEvent", async (msg) => {
        let eventInfo = JSON.parse(msg.content.toString());

        if (!eventInfo) {
          return response.status(400).json({ error: "Event does not exists" });
        }

        await rabbitmq.createQueue("syncEventQuantity");
        await rabbitmq.sendToQueue(
          "syncEventQuantity",
          JSON.stringify({
            id: data.eventId,
            quantity: eventInfo.event.quantity + toInsert["quantity"],
          })
        );
      });

      const total = update
        .map((item) => {
          return item["price"] * item["quantity"];
        })
        .reduce((a, b) => a + b, 0)
        .toFixed(2);

      const cart = await CartRepository.updateCart(
        update,
        authResponse.id,
        parseFloat(total)
      );

      return response.status(200).json(cart);
    });

    setTimeout(async () => {
      await rabbitmq.close();
    }, 1500);
  }

  async discardCart(request: Request, response: Response) {
    const data = request.body;
    const auth = request.headers.authorization;

    const rabbitmq = new RabbitMQ("amqp://admin:admin@localhost:5672");
    await rabbitmq.connect();
    await rabbitmq.sendToQueue("isAuth", auth);

    await rabbitmq.consume("authResponse", async (msg) => {
      let authResponse = JSON.parse(msg.content.toString());

      const cartExists = await CartRepository.getCartByUserId(authResponse.id);

      if (!cartExists) {
        return response.status(400).json({ error: "Cart does not exists" });
      }

      cartExists.itens.map(async (item) => {
        await rabbitmq.createQueue("getEvents");
        await rabbitmq.sendToQueue("getEvents", JSON.stringify(item["id"]));

        await rabbitmq.consume("returnEvent", async (msg) => {
          let eventInfo = JSON.parse(msg.content.toString());

          await rabbitmq.createQueue("syncEventQuantity");
          await rabbitmq.sendToQueue(
            "syncEventQuantity",
            JSON.stringify({
              id: item["id"],
              quantity: eventInfo["event"].quantity + item["quantity"],
            })
          );
        });
      });

      await CartRepository.deleteCart(data.id);

      return response.status(200).json({ message: "Cart discarded" });
    });

    setTimeout(async () => {
      await rabbitmq.close();
    }, 1500);
  }

  async checkoutCart(request: Request, response: Response) {
    const data = request.body;
    const auth = request.headers.authorization;

    const rabbitmq = new RabbitMQ("amqp://admin:admin@localhost:5672");
    await rabbitmq.connect();
    await rabbitmq.sendToQueue("isAuth", auth);

    await rabbitmq.consume("authResponse", async (msg) => {
      let authResponse = JSON.parse(msg.content.toString());

      const cartExists = await CartRepository.getCartByUserId(authResponse.id);

      if (!cartExists) {
        return response.status(400).json({ error: "Cart does not exists" });
      }

      const cart = await CartRepository.checkoutCart(data.id);

      return response.status(200).json(cart);
    });

    setTimeout(async () => {
      await rabbitmq.close();
    }, 10000);
  }

  async listCartHistoric(request: Request, response: Response) {
    const data = request.body;
    const auth = request.headers.authorization;

    const rabbitmq = new RabbitMQ("amqp://admin:admin@localhost:5672");
    await rabbitmq.connect();
    await rabbitmq.sendToQueue("isAuth", auth);

    await rabbitmq.consume("authResponse", async (msg) => {
      let authResponse = JSON.parse(msg.content.toString());

      const cartExists = await CartRepository.listAllCartByUser(
        authResponse.id
      );

      if (!cartExists) {
        return response.status(400).json({ error: "Cart does not exists" });
      }

      return response.status(200).json(cartExists);
    });

    await rabbitmq.close();
    // setTimeout(async () => {
    // }, 1500);
  }
}

export default new CartController();
