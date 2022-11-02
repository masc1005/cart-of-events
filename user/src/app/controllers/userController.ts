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

    return response.json(users);
  }

  async update(request: Request, response: Response) {
    const { id } = request.params;
    const body = request.body;

    const userExists = await UserRepository.findById(id);

    if (!userExists) {
      return response.status(400).json({ error: "User not exists" });
    }

    const user = await UserRepository.update(id, body);

    return response.json(user);
  }

  async delete(request: Request, response: Response) {
    const { id } = request.params;

    const userExists = await UserRepository.findById(id);

    if (!userExists) {
      return response.status(400).json({ error: "User not exists" });
    }

    const user = await UserRepository.delete(id);

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
