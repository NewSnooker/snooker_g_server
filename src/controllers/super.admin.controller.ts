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
            logger.warn("[SUPER_ADMIN][beforeHandle] Unauthorized");
            return errMsg.Unauthorized;
          }
          if (!hasSuperAdminRole(authUser.roles)) {
            set.status = 403;
            logger.warn(
              "[SUPER_ADMIN][beforeHandle] Forbidden: Not a super admin"
            );
            return errMsg.Forbidden;
          }
        },
      },
      (app) =>
        app
          .put(
            "/force-logout",
            async ({ body, set }) => {
              const { ids } = body as { ids: string[] };
              if (!ids || ids.length === 0) {
                set.status = 400;
                return errMsg.InvalidId;
              }

              const response = await superAdminService.forceLogoutUserById(ids);
              set.status = response.status;
              return response;
            },
            {
              body: t.Object({ ids: t.Array(t.String()) }),
              response: {
                200: msgSchema,
                400: msgSchema,
                401: msgSchema,
                403: msgSchema,
                404: msgSchema,
                500: msgSchema,
              },
              detail: {
                summary: "Force logout users",
                description:
                  "API สำหรับ Super Admin เพื่อบังคับให้ผู้ใช้หลายคน (รวมถึง Admin) หลุดออกจากระบบ",
              },
            }
          )
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
          .delete(
            "/soft-delete",
            async (context) => {
              const { body, set, authUser } = context as authContext;
              const { ids } = body as { ids: string[] };
              if (!ids || ids.length === 0 || ids.includes(authUser.id)) {
                set.status = 400;
                logger.warn("[SUPER_ADMIN][softDeleteUser] cannot delete self");
                return errMsg.CannotDeleteSelf;
              }

              const logoutResponse =
                await superAdminService.forceLogoutUserById(ids);
              if (logoutResponse.status === 200) {
                const softDeleteResponse =
                  await superAdminService.softDeleteUserById(ids);
                set.status = softDeleteResponse.status;
                return softDeleteResponse;
              }
              set.status = logoutResponse.status;
              return logoutResponse;
            },
            {
              body: t.Object({ ids: t.Array(t.String()) }),
              response: {
                200: msgSchema,
                400: msgSchema,
                401: msgSchema,
                403: msgSchema,
                404: msgSchema,
                500: msgSchema,
              },
              detail: {
                summary: "Soft delete users",
                description:
                  "API สำหรับ Super Admin เพื่อลบผู้ใช้หลายคน (รวมถึง Admin) แบบ soft delete",
              },
            }
          )
          .delete(
            "/hard-delete",
            async ({ body, set }) => {
              const { ids } = body as { ids: string[] };
              if (!ids || ids.length === 0) {
                set.status = 400;
                return errMsg.InvalidId;
              }

              const response = await superAdminService.hardDeleteUserById(ids);
              set.status = response.status;
              return response;
            },
            {
              body: t.Object({ ids: t.Array(t.String()) }),
              response: {
                200: msgSchema,
                400: msgSchema,
                401: msgSchema,
                403: msgSchema,
                404: msgSchema,
                500: msgSchema,
              },
              detail: {
                summary: "Hard delete users",
                description:
                  "API สำหรับ Super Admin เพื่อลบผู้ใช้หลายคน (รวมถึง Admin) ออกจากระบบอย่างถาวร",
              },
            }
          )
          .put(
            "/restore",
            async ({ body, set }) => {
              const { ids } = body as { ids?: string[] };
              if (!ids || ids.length === 0) {
                set.status = 400;
                return errMsg.InvalidId;
              }

              const response = await superAdminService.restoreUser(ids);
              set.status = response.status;
              return response;
            },
            {
              body: t.Object({ ids: t.Array(t.String()) }),
              response: {
                200: msgSchema,
                400: msgSchema,
                401: msgSchema,
                403: msgSchema,
                404: msgSchema,
                500: msgSchema,
              },
              detail: {
                summary: "Restore users",
                description:
                  "API สำหรับ Super Admin เพื่อกู้คืนผู้ใช้หลายคน (รวมถึง Admin) ที่ถูกลบ",
              },
            }
          )
    )
);
