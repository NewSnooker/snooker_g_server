import { Elysia, error, t } from "elysia";
import { msgSchema } from "../schema/common.schema";
import { errMsg } from "@/config/message.error";
import { adminService } from "@/services/admin.service";

export const adminController = new Elysia().group(
  "/admin",
  { tags: ["Admin"] },
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
          .post(
            "/force-logout/:id",
            async ({ params }) => {
              return await adminService.forceLogoutById(params.id);
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
            async () => {
              return await adminService.forceLogoutAll();
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
    )
);
