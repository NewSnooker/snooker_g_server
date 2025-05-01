import { Elysia, t } from "elysia";
import { msgSchema } from "../schema/common.schema";
import { authContext } from "@/interface/common.interface";
import { logger } from "@/utils/logger";
import { errMsg } from "@/config/message.error";
import { hasSuperAdminRole } from "@/utils/auth";
import { superAdminService } from "@/services/super.admin.service";

export const superAdminController = new Elysia().group(
  "/super-admin",
  { tags: ["Super Admin"] },
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
          if (!hasSuperAdminRole(authUser.roles)) {
            set.status = 403;
            logger.warn("[ADMIN][beforeHandle] Forbidden: Not an admin");
            return errMsg.Forbidden;
          }
        },
      },
      (app) =>
        app
          .put(
            "/force-logout-all",
            async (context) => {
              const { authUser, set } = context as authContext;
              const response = await superAdminService.forceLogoutAll(
                authUser.id
              );
              set.status = response.status;
              return response;
            },
            {
              response: {
                200: msgSchema,
                401: msgSchema,
                403: msgSchema,
                500: msgSchema,
              },
              detail: {
                summary: "Force logout all users",
                description:
                  "API สำหรับ Super Admin เพื่อบังคับให้ผู้ใช้ทุกคนหลุดออกจากระบบ ยกเว้นตัวเอง",
              },
            }
          )
          .put(
            "/force-logout/:id",
            async ({ params, set }) => {
              const response = await superAdminService.forceLogoutUserById(
                params.id
              );
              set.status = response.status;
              return response;
            },
            {
              detail: {
                summary: "Force logout user",
                description:
                  "API สำหรับ Admin เพื่อบังคับให้ผู้ใช้คนหนึ่ง หรือ ผู้ดูแลระบบ หลุดออกจากระบบ",
              },
              response: {
                200: msgSchema,
                400: msgSchema,
                401: msgSchema,
                403: msgSchema,
                404: msgSchema,
                500: msgSchema,
              },
            }
          )
          .put(
            "/soft-delete/:id",
            async (context) => {
              const { params, set, authUser } = context as authContext & {
                params: { id: string };
              };
              if (params.id === authUser.id) {
                set.status = 400;
                return errMsg.InvalidId;
              }
              const logoutResponse =
                await superAdminService.forceLogoutUserById(params.id);
              if (logoutResponse.status === 200) {
                const softDeleteResponse =
                  await superAdminService.softDeleteUserById(params.id);
                set.status = softDeleteResponse.status;
                return softDeleteResponse;
              }
              set.status = logoutResponse.status;
              return logoutResponse;
            },
            {
              response: {
                200: msgSchema,
                400: msgSchema,
                403: msgSchema,
                404: msgSchema,
                500: msgSchema,
              },
              detail: {
                summary: "Soft delete user",
                description:
                  "API สำหรับ Admin เพื่อลบผู้ใช้ หรือ ผู้ดูแลระบบ ออกจากระบบ ",
              },
            }
          )
          .put(
            "/hard-delete/:id",
            async (context) => {
              const { params, set } = context as authContext & {
                params: { id: string };
              };
              const response = await superAdminService.hardDeleteUserById(
                params.id
              );
              set.status = response.status;
              return response;
            },
            {
              response: {
                200: msgSchema,
                401: msgSchema,
                400: msgSchema,
                403: msgSchema,
                404: msgSchema,
                500: msgSchema,
              },
              detail: {
                summary: "Hard delete user",
                description:
                  "API สำหรับ Admin เพื่อลบผู้ใช้ หรือ ผู้ดูแลระบบ ออกจากระบบ ",
              },
            }
          )
          .put(
            "/restore/:id",
            async (context) => {
              const { params, set } = context as authContext & {
                params: { id: string };
              };
              const response = await superAdminService.restoreUser(params.id);
              set.status = response.status;
              return response;
            },
            {
              response: {
                200: msgSchema,
                401: msgSchema,
                400: msgSchema,
                403: msgSchema,
                404: msgSchema,
                500: msgSchema,
              },
              detail: {
                summary: "Restore user",
                description:
                  "API สำหรับ Admin เพื่อกู้คืนผู้ใช้ หรือ ผู้ดูแลระบบ ที่ถูกลบออกจากระบบ ",
              },
            }
          )
    )
);
