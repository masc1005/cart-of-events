import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface TokenPayload {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

export default async function authMiddleware(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const { authorization } = request.headers;

  if (!authorization) {
    response.sendStatus(401);
  }

  const token = authorization.replace("Bearer", "").trim();

  try {
    const data = jwt.verify(token, process.env.AUTH_SECRET);

    const { id, role } = data as TokenPayload;

    request.userId = id;
    request.userRole = role;

    return next();
  } catch {
    response.sendStatus(401);
  }
}
