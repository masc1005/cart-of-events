import { compare } from "bcryptjs";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import UserRepository from "../repository/userRepository";

class UserController {
  async create(request: Request, response: Response) {
    const body = request.body;

    const userExists = await UserRepository.findByEmail(body.email);

    if (userExists) {
      return response.status(400).json({ error: "User already exists" });
    }

    const save = await UserRepository.create(body);

    return response.status(201).json(save);
  }

  async findAll(request: Request, response: Response) {
    const users = await UserRepository.findAll();

    for (const user of users) {
      delete user.password;
    }

    return response.json(users);
  }

  async update(request: Request, response: Response) {
    const body = request.body;

    const userExists = await UserRepository.findById(request.userId);

    if (!userExists) {
      return response.status(400).json({ error: "User not exists" });
    }

    const user = await UserRepository.update(request.userId, body);

    return response.json(user);
  }

  async delete(request: Request, response: Response) {
    const userExists = await UserRepository.findById(request.userId);

    if (!userExists) {
      return response.status(400).json({ error: "User not exists" });
    }

    const user = await UserRepository.delete(request.userId);

    return response.json(user);
  }

  async login(request: Request, response: Response) {
    const { email, password } = request.body;

    const user = await UserRepository.findByEmail(email);

    if (!user) {
      response.sendStatus(401);
    }

    const isValid = await compare(password, user.password);

    if (!isValid) {
      response.sendStatus(401);
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.AUTH_SECRET
    );

    delete user.password;

    return response.json({
      user,
      token,
    });
  }
}

export default new UserController();
