import { Router } from "express";
import { RabbitMQ } from "./config/rabbitmq";

import UserController from "./app/controllers/userController";
import authMiddleware from "./app/middleware/authMiddleware";

const routes = Router();

// home
routes.get("/", (request, response) => {
  return response.json({ msg: "Hello World" });
});

// register
routes.post("/users", UserController.create);

// login
routes.post("/login", UserController.login);

// auth
routes.use(authMiddleware);

// user
routes.get("/users", UserController.findAll);
routes.put("/users/:id", UserController.update);
routes.delete("/users/:id", UserController.delete);

export default routes;
