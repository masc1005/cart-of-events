import { prisma } from "../../config/database";

type Event = {
  id: string;
  name: string;
  price: number;
  date: string;
  artist: string;
  location: string;
  quantity: number;
};

class EventRepository {
  async createEvent(data: object) {
    const { name, price, date, artist, location, quantity } = data as Event;

    const eventDate = new Date(Date.parse(date));

    const result = await prisma.events.create({
      data: {
        name,
        price,
        date: eventDate,
        artist,
        location,
        quantity,
      },
    });

    return result;
  }

  async getEvents() {
    const result = await prisma.events.findMany();

    return result;
  }

  async getEventsByNames(data: object) {
    const { name, date, artist, location } = data as Event;

    const eventDate = new Date(Date.parse(date));

    const result = await prisma.events.findFirst({
      where: {
        name: {
          equals: name,
        },
        date: {
          equals: eventDate,
        },
        artist: {
          equals: artist,
        },
        location: {
          equals: location,
        },
      },
    });

    return result;
  }

  async getEventById(data: object) {
    const { id } = data as Event;

    const result = await prisma.events.findFirst({
      where: {
        id: id,
      },
    });

    return result;
  }

  async updateEvent(data: object) {
    const { id, name, price, date, artist, location, quantity } = data as Event;

    const result = await prisma.events.update({
      where: {
        id,
      },
      data: {
        name,
        price,
        date,
        artist,
        location,
        quantity,
      },
    });

    return result;
  }

  async deleteEvent(data: object) {
    const { id } = data as Event;

    const result = await prisma.events.delete({
      where: {
        id,
      },
    });

    return result;
  }
}

export default new EventRepository();
