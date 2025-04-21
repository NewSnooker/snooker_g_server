import { Elysia } from "elysia";
import { authController } from "./controllers/auth.controller";
import { userController } from "./controllers/user.controller";
import { adminController } from "./controllers/admin.controller";

export const routes = new Elysia({ prefix: "/api" })
  .use(authController)
  .use(userController)
  .use(adminController);
