import { Elysia, error, t } from "elysia";
import { userBody, userRes } from "../schema/user.schema";
import { userService } from "../services/user.service";
import { msgSchema } from "../schema/common.schema";
import errMsg from "../config/message.error.json";

export const userController = new Elysia().group(
  "/user",
  { tags: ["User"] },
  (app) =>
    app.guard(
      {
        beforeHandle: ({ authUser }: any) => {
          if (!authUser) {
            throw error(401, errMsg.Unauthorized);
          }
        },
      },
      (app) =>
        app
          .get(
            "/",
            async ({ query }: any) => {
              const page = Number(query.page) || 1;
              const limit = Number(query.limit) || 10;

              return await userService.getAllUsersPaginated(page, limit);
            },
            {
              query: t.Object({
                page: t.Optional(t.String()),
                limit: t.Optional(t.String()),
              }),
              response: {
                200: t.Object({
                  status: t.String(),
                  data: t.Array(userRes),
                  pagination: t.Object({
                    total: t.Number(),
                    page: t.Number(),
                    limit: t.Number(),
                    totalPages: t.Number(),
                  }),
                }),
                401: msgSchema,
                404: msgSchema,
                500: msgSchema,
              },
            }
          )

          .get(
            "/:id",
            async ({ params }) => {
              return await userService.getUserById(params.id);
            },
            {
              params: t.Object({
                id: t.String(),
              }),
              response: {
                200: t.Object({
                  status: t.String(),
                  data: userRes,
                }),
                400: msgSchema,
                404: msgSchema,
                500: msgSchema,
              },
            }
          )
          .put(
            "/:id",
            async ({ params, body }) => {
              return await userService.updateUser(params.id, body);
            },
            {
              params: t.Object({
                id: t.String(),
              }),
              body: userBody,
              response: {
                200: msgSchema,
                400: msgSchema,
                404: msgSchema,
                409: msgSchema,
                500: msgSchema,
              },
            }
          )
          .delete(
            "/:id",
            async ({ params }) => {
              return await userService.deleteUser(params.id);
            },
            {
              params: t.Object({
                id: t.String(),
              }),
              response: {
                200: msgSchema,
                400: msgSchema,
                404: msgSchema,
                500: msgSchema,
              },
            }
          )
    )
);
