import { prisma } from "../../config/database";
import { hash } from "bcryptjs";

type User = {
  name: string;
  email: string;
  password: string;
  age: number;
  role: string | "client";
};

class UserRepository {
  async create(data: object) {
    const { name, email, password, age, role } = data as User;

    const save = await prisma.user.create({
      data: {
        name,
        email,
        password: await hash(password, 10),
        age,
        role,
      },
    });

    return save;
  }

  async findByEmail(email: string) {
    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    return user;
  }

  async findAll() {
    const users = await prisma.user.findMany();

    return users;
  }

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });

    return user;
  }

  async update(id: string, data: object) {
    const { name, email, password, age } = data as User;

    const user = await prisma.user.update({
      where: {
        id,
      },
      data: {
        name,
        email,
        password: await hash(password, 8),
        age,
      },
    });

    return user;
  }

  async delete(id: string) {
    const user = await prisma.user.delete({
      where: {
        id,
      },
    });

    return user;
  }
}

export default new UserRepository();
