import { prisma } from "../../config/database";

type Cart = {
  id: string;
  eventId: string;
  quantity: number;
  itens: object[];
};

type Event = {
  id: string;
  name: string;
  price: number;
  date: Date;
  artist: string;
  location: string;
  quantity: number;
};

class CartRepository {
  async create(data: Cart, eventInfo: Event, userId: string) {
    const addToCart = data as Cart;

    let total = eventInfo.price * addToCart.quantity;
    let infos = {
      id: eventInfo.id,
      name: eventInfo.name,
      artist: eventInfo.artist,
      quantity: addToCart.quantity,
      date: JSON.stringify(eventInfo.date),
      price: eventInfo.price,
      location: eventInfo.location,
    };

    return await prisma.cart.create({
      data: {
        userId,
        itens: [infos],
        price: total,
        eventsIds: eventInfo.id,
        status: 1,
      },
    });
  }

  async getById(data: object) {
    const { id } = data as Cart;

    return await prisma.cart.findFirst({
      where: {
        id,
      },
    });
  }

  async getCartByUserId(userId: string) {
    return await prisma.cart.findFirst({
      where: {
        userId,
        AND: {
          status: 1,
        },
      },
    });
  }

  async listAllCartByUser(userId: string) {
    return await prisma.cart.findMany({
      where: {
        userId,
      },
    });
  }

  async updateCart(data: any, userId: string, total: number) {
    return await prisma.cart.update({
      where: {
        userId,
      },
      data: {
        itens: data,
        price: total,
      },
    });
  }

  async addEventToCart(
    data: object,
    eventInfo: Event,
    userId: string,
    total: number
  ) {
    const addToCart = data as Cart;

    let infos = {
      id: eventInfo.id,
      name: eventInfo.name,
      artist: eventInfo.artist,
      quantity: addToCart.quantity,
      date: JSON.stringify(eventInfo.date),
      price: eventInfo.price,
      location: eventInfo.location,
    };

    const upsert = await prisma.cart.upsert({
      create: {
        itens: [infos],
        price: total,
        status: 1,
        eventsIds: eventInfo.id,
        id: addToCart.id,
        userId,
      },
      update: {
        price: total,
        eventsIds: {
          push: eventInfo.id,
        },
        itens: {
          push: infos,
        },
      },
      where: {
        userId,
      },
    });

    return upsert;
  }

  async deleteCart(id: string) {
    return await prisma.cart.delete({
      where: {
        id,
      },
    });
  }

  async checkoutCart(id: string) {
    return await prisma.cart.update({
      where: {
        id,
      },
      data: {
        status: 0,
      },
    });
  }
}

export default new CartRepository();
