import { Router } from "express";
import CartController from "./app/controller/cartController";

const routes = Router();

routes.get("/", (request, response) => {
  return response.json({ message: "Hello World" });
});

routes.get("/cart", CartController.getCartByUserId);
routes.get("/historic/cart", CartController.listCartHistoric);
routes.post("/cart", CartController.createCart);
routes.put("/cart/add", CartController.addEventToCart);
routes.put("/remove/cart", CartController.removeEventFromCart);
routes.put("/checkout/cart", CartController.checkoutCart);
routes.delete("/dicard/cart", CartController.discardCart);



export default routes;
