import { Elysia, t } from "elysia";
import { userSchema, userRes } from "../schema/user.schema";
import { userService } from "../services/user.service";
import { msgSchema } from "../schema/common.schema";
import { errMsg } from "@/config/message.error";
import { authContext } from "@/interface/common.interface";
import { logger } from "@/utils/logger";

export const userController = new Elysia().group(
  "/user",
  { tags: ["User"] },
  (app) =>
    app.guard(
      {
        beforeHandle: (context) => {
          const { authUser, set } = context as authContext;
          if (!authUser) {
            set.status = 401;
            logger.warn("[USER][beforeHandle] Unauthorized");
            return errMsg.Unauthorized;
          }
        },
      },
      (app) =>
        app
          .get(
            "/",
            async ({ query, set }) => {
              const page = Number(query?.page) || 1;
              const limit = Number(query?.limit) || 10;
              const response = await userService.getAllUsersPaginated(
                page,
                limit
              );
              set.status = response.status;
              return response;
            },
            {
              query: t.Object({
                page: t.Optional(t.String()),
                limit: t.Optional(t.String()),
              }),
              response: {
                200: t.Object({
                  status: t.Number(),
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
            async ({ params, set }) => {
              const response = await userService.getUserById(params.id);
              set.status = response.status;
              return response;
            },
            {
              params: t.Object({
                id: t.String(),
              }),
              response: {
                200: t.Object({
                  status: t.Number(),
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
            async ({ params, body, set }) => {
              const response = await userService.updateUser(params.id, body);
              set.status = response.status;
              return response;
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
            async ({ params, set }) => {
              const response = await userService.deleteUser(params.id);
              set.status = response.status;
              return response;
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
            async ({ authUser, set, cookie: { auth } }: any) => {
              // เรียกฟังก์ชัน getUserById โดยใช้ ID ของ authUser
              const user = await userService.getUserById(authUser.id);

              // ตรวจสอบว่า tokenVersion ของ user ตรงกับที่ authUser ส่งมา
              if (
                user.status === 200 &&
                user.data.tokenVersion !== authUser.tokenVersion
              ) {
                // ลบคุกกี้ (force logout)
                // จากนั้นให้ middleware เตะ user ออก

                auth.remove();
                set.status = 403;
                logger.warn("[USER][ME] TokenInvalidated");
                return errMsg.TokenInvalidated;
              }

              // ส่งข้อมูลผู้ใช้กลับเมื่อ tokenVersion ตรงกัน
              return user; // { status: "success", data: user }
            },
            {
              response: {
                200: t.Object({
                  status: t.Number(),
                  data: userRes, // ควรเป็น schema ของ user
                }),
                401: msgSchema,
                403: msgSchema,
                404: msgSchema,
                500: msgSchema,
              },
            }
          )
    )
);
