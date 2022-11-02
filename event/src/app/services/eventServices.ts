import eventRepository from "../repository/eventRespository";

type Event = {
  id: string;
  quantity: number;
  name: string;
  price: number;
  date: Date;
  artist: string;
  location: string;
};

class EventServices {
  async getEventById(data: object) {
    const { quantity } = data as Event;

    const event = await eventRepository.getEventById(data);

    let isEnoughTickets = event.quantity - quantity;

    return { event, isEnoughTickets };
  }

  async updateEvent(data: object) {
    const event = await eventRepository.updateEvent(data);
    return event;
  }
}

export default new EventServices();
