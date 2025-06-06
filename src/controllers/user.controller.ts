import { Elysia, t } from "elysia";
import { userService } from "../services/user.service";
import { errMsg } from "@/config/message.error";
import { authContext } from "@/interface/common.interface";
import { logger } from "@/utils/logger";
import { msgSchema } from "@/schema/common.schema";
import { avatarSchema, userResSchema } from "@/schema/user.schema";
import { hasUserRole } from "@/utils/auth";

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
          if (!hasUserRole(authUser.roles)) {
            set.status = 403;
            logger.warn("[USER][beforeHandle] Forbidden: Not an user");
            return errMsg.Forbidden;
          }
        },
      },
      (app) =>
        app
          .get(
            "/:id",
            async ({ params, set }) => {
              const response = await userService.getActiveUserById(params.id);
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
                  data: userResSchema,
                }),
                400: msgSchema,
                401: msgSchema,
                403: msgSchema,
                404: msgSchema,
                500: msgSchema,
              },
              detail: {
                summary: "Get user by id",
                description: "API สำหรับผู้ใช้เพื่อดูข้อมูลผู้ใช้",
              },
            }
          )
          .get(
            "/me",
            async (context) => {
              const {
                authUser,
                set,
                cookie: { auth },
              } = context as authContext;
              const user = await userService.getActiveUserById(authUser.id);

              // ตรวจสอบว่า tokenVersion ของ user ตรงกับที่ authUser ส่งมา
              if (
                user.status === 200 &&
                user.data.tokenVersion !== authUser.tokenVersion
              ) {
                auth.remove();
                set.status = 403;
                logger.warn("[USER][ME] TokenInvalidated");
                return errMsg.TokenInvalidated;
              }
              return user;
            },
            {
              response: {
                200: t.Object({
                  status: t.Number(),
                  data: userResSchema,
                }),
                401: msgSchema,
                403: msgSchema,
                404: msgSchema,
                500: msgSchema,
              },
              detail: {
                summary: "Get me",
                description: "API สำหรับผู้ใช้เพื่อดูข้อมูลตัวเอง",
              },
            }
          )
          .put(
            "/avatar/:id",
            async ({ params: { id }, body, set }) => {
              const response = await userService.updateAvatar(id, body.avatar);
              set.status = response.status;
              return response;
            },
            {
              body: t.Object({
                avatar: avatarSchema,
              }),
              response: {
                200: msgSchema,
                400: msgSchema,
                404: msgSchema,
                409: msgSchema,
                500: msgSchema,
              },
              detail: {
                summary: "Update avatar",
                description: "API สำหรับผู้ใช้เพื่ออัพเดตรูปโปรไฟล์",
              },
            }
          )
          .put(
            "/me/username/:id",
            async ({ params: { id }, body, set }) => {
              const response = await userService.updateUsername(
                id,
                body.username
              );
              set.status = response.status;
              return response;
            },
            {
              body: t.Object({
                username: t.String(),
              }),
              response: {
                200: msgSchema,
                400: msgSchema,
                404: msgSchema,
                409: msgSchema,
                500: msgSchema,
              },
              detail: {
                summary: "Update username",
                description: "API สำหรับผู้ใช้เพื่ออัพเดตชื่อผู้ใช้",
              },
            }
          )
    )
);
