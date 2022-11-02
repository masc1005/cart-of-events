import { Router } from "express";
import EventController from "./app/controller/eventController";

const routes = Router();

routes.get("/", (request, response) => {
  return response.json({ message: "Hello World" });
});


// routes.use()

routes.get("/events", EventController.show);
routes.post("/events", EventController.create);
routes.put("/events", EventController.update);
routes.delete("/events", EventController.delete);


export default routes;
