import { cors } from "@elysiajs/cors";
import { Elysia, NotFoundError } from "elysia";
import { routes } from "./routes";
import { swaggerPlugin } from "./plugins/swagger.plugin";
import jwt from "@elysiajs/jwt";
import cookie from "@elysiajs/cookie";
import { logger } from "./utils/logger";

// Load ENV
const env = process.env.NODE_ENV || "development";

//  process.env.GOOGLE_CLIENT_ID;
// process.env.GOOGLE_CLIENT_SECRET;
// process.env.GOOGLE_REDIRECT_URL;

const app = new Elysia()
  // ตกแต่งด้วย winston logger
  .decorate("logger", logger)
  .use(cookie())
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "fallback-secret-for-dev",
    })
  )
  .use(
    cors({
      origin: ["http://localhost:3000"],
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      credentials: true,
      maxAge: 86400, //👍 browser จำผล preflight ไว้ 24 ชม.
    })
  )
  .derive(async ({ jwt, cookie: { auth } }) => {
    const authUser = await jwt.verify(auth.value);
    return { authUser };
  })
  .use(swaggerPlugin())
  .use(routes)
  .onError(({ code, error, logger }) => {
    if (error instanceof NotFoundError) {
      logger.warn(`NotFoundError: ${error.message}`);
      return {
        status: 500,
        message: "API Endpoint or Method: " + error.message,
      };
    }

    logger.error("Unhandled Error:", error);
    return {
      status: 500,
      message: "Something went wrong!!: ",
    };
  });

// Start server
if (env !== "production") {
  app.listen(process.env.PORT || 5000, () => {
    console.log(
      `🚀 Game API is running at http://${app.server?.hostname}:${app.server?.port}`
    );
  });
}
// Export type เพื่อใช้กับ Eden
export type app = typeof app;
