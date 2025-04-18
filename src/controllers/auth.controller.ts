import { Elysia, t } from "elysia";
import { authService } from "../services/auth.service";
import { userBody, userBodyLogin } from "../schema/user.schema";
import { msgSchema } from "../schema/common.schema";

interface JwtPayload {
  id: string;
}

export const authController = new Elysia().group(
  "/auth",
  { tags: ["Auth"] },
  (app) =>
    app
      .post(
        "/sign-up",
        async ({ body, set }) => {
          set.status = 201;
          return await authService.signUp(body);
        },
        {
          body: userBody,
          response: {
            201: msgSchema,
            400: msgSchema,
            409: msgSchema,
            500: msgSchema,
          },
        }
      )
      .post(
        "/sign-in",
        async ({ body, cookie: { auth }, jwt }: any) => {
          const response = await authService.signIn(body);
          const value = await jwt.sign({
            id: response.data.id,
          });
          auth.set({
            value,
            maxAge: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
            httpOnly: true,
            secure: true,
            path: "/",
          });

          return { response: { ...response, value } };
        },
        {
          body: userBodyLogin,
          response: {
            200: t.Object({
              response: t.Object({
                status: t.String(),
                message: t.String(),
                data: t.Object({
                  id: t.String(),
                }),
                value: t.String(),
              }),
            }),
            400: msgSchema,
            404: msgSchema,
            409: msgSchema,
            500: msgSchema,
          },
        }
      )
);
