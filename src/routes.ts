import { Elysia } from "elysia";
import { authController } from "./controllers/auth.controller";
import { userController } from "./controllers/user.controller";
import { adminController } from "./controllers/admin.controller";

export const routes = new Elysia({ prefix: "/api" })
  .use(adminController)
  .use(authController)
  .use(userController)
  .get("/", () => "Hello Elysia");
