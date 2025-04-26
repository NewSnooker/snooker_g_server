import { Elysia, error, t } from "elysia";
import { msgSchema } from "../schema/common.schema";
import { errMsg } from "@/config/message.error";
import { adminService } from "@/services/admin.service";
import { authContext } from "@/interface/common.interface";
import { logger } from "@/utils/logger";

export const adminController = new Elysia().group(
  "/admin",
  { tags: ["Admin"] },
  (app) =>
    app.guard(
      {
        beforeHandle: (context) => {
          const { authUser, set } = context as authContext;
          if (!authUser) {
            set.status = 401;
            logger.warn("[ADMIN][beforeHandle] Unauthorized");
            return errMsg.Unauthorized;
          }
        },
      },
      (app) =>
        app
          .post(
            "/force-logout/:id",
            async ({ params, set }) => {
              const response = await adminService.forceLogoutById(params.id);
              set.status = response.status;
              return response;
            },
            {
              detail: {
                // summary: "Force logout by Admin",
                description:
                  "API สำหรับแอดมินเพื่อบังคับให้ผู้ใช้คนหนึ่งหลุดออกจากระบบทันที",
              },
              response: {
                200: msgSchema,
                400: msgSchema,
                401: msgSchema,
                404: msgSchema,
                500: msgSchema,
              },
            }
          )
          .post(
            "/force-logout-all",
            async ({ set }) => {
              const response = await adminService.forceLogoutAll();
              set.status = response.status;
              return response;
            },
            {
              detail: {
                description:
                  "API สำหรับแอดมินเพื่อบังคับให้ผู้ใช้ทุกคนหลุดออกจากระบบ",
              },
              response: {
                200: msgSchema,
                401: msgSchema,
                500: msgSchema,
              },
            }
          )
          .delete(
            "/:id",
            async ({ params, set }) => {
              const response = await adminService.deleteUser(params.id);
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
    )
);
