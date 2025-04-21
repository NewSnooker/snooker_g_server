import { Elysia, error, t } from "elysia";
import { userSchema, userRes } from "../schema/user.schema";
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
            async ({ query }) => {
              const page = Number(query?.page) || 1;
              const limit = Number(query?.limit) || 10;

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
              body: userSchema,
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
          .get(
            "/me",
            async ({ authUser, cookie: { auth } }: any) => {
              // เรียกฟังก์ชัน getUserById โดยใช้ ID ของ authUser
              const user = await userService.getUserById(authUser.id);

              // ตรวจสอบว่า tokenVersion ของ user ตรงกับที่ authUser ส่งมา
              if (user.data.tokenVersion !== authUser.tokenVersion) {
                // ลบคุกกี้ (force logout)
                auth.remove();
                throw error(403, errMsg.TokenInvalidated);
              }

              // ส่งข้อมูลผู้ใช้กลับเมื่อ tokenVersion ตรงกัน
              return user; // { status: "success", data: user }
            },
            {
              response: {
                200: t.Object({
                  status: t.String(),
                  data: userRes, // ควรเป็น schema ของ user
                }),
                203: msgSchema,
                401: msgSchema,
                403: msgSchema,
                404: msgSchema,
                500: msgSchema,
              },
            }
          )
    )
);
