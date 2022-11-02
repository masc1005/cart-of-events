import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { RabbitMQ } from "../../config/rabbitmq";

interface TokenPayload {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

export default async function authService(authToken: string) {
  const token = authToken.replace("Bearer", "").trim();
  const data = jwt.verify(token, process.env.AUTH_SECRET);

  const { id, role } = data as TokenPayload;

  const authResponse = { id, role };

  return authResponse;
}
