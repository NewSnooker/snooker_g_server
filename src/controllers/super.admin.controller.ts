import { Elysia, t } from "elysia";
import { msgSchema } from "../schema/common.schema";
import { authContext } from "@/interface/common.interface";
import { logger } from "@/utils/logger";
import { errMsg } from "@/config/message.error";
import { hasSuperAdminRole } from "@/utils/permission";
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
            async (context) => {
              const { body, set, authUser } = context as authContext;
              const { ids } = body as { ids: string[] };
              const response = await superAdminService.forceLogoutUserById(
                ids,
                authUser.id
              );
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
          .delete(
            "/soft-delete",
            async (context) => {
              const { body, set, authUser } = context as authContext;
              const { ids } = body as { ids: string[] };
              const logoutResponse =
                await superAdminService.forceLogoutUserById(ids, authUser.id);
              if (logoutResponse.status === 200) {
                const softDeleteResponse =
                  await superAdminService.softDeleteUserById(ids, authUser.id);
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
            async (context) => {
              const { body, set, authUser } = context as authContext;
              const { ids } = body as { ids: string[] };
              const response = await superAdminService.hardDeleteUserById(
                ids,
                authUser.id
              );
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
            async (context) => {
              const { body, set, authUser } = context as authContext;
              const { ids } = body as { ids: string[] };

              const response = await superAdminService.restoreUser(
                ids,
                authUser.id
              );
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
          .post(
            "/impersonate",
            async ({ body, set, jwt, cookie: { auth }, authUser }: any) => {
              const { userIdToImpersonate } = body;
              const response = await superAdminService.impersonateUser(
                authUser.id,
                userIdToImpersonate
              );
              if (response.status === 200) {
                const token = await jwt.sign({
                  id: response.data.id,
                  roles: response.data.roles,
                  tokenVersion: response.data.tokenVersion,
                  impersonated: true,
                  impersonatorId: response.data.impersonatorId,
                });

                auth.set({
                  value: token,
                  maxAge: 60 * 60 * 24,
                  httpOnly: true,
                  secure: process.env.NODE_ENV === "production",
                  path: "/",
                });

                return { ...response, value: token };
              }

              set.status = response.status;
              return response;
            },
            {
              body: t.Object({
                userIdToImpersonate: t.String(),
              }),
              response: {
                200: t.Object({
                  status: t.Number(),
                  message: t.String(),
                  data: t.Object({
                    id: t.String(),
                    roles: t.Array(t.String()),
                    tokenVersion: t.Number(),
                    impersonated: t.Boolean(),
                    impersonatorId: t.String(),
                  }),
                  value: t.String(),
                }),
                401: msgSchema,
                404: msgSchema,
              },
              detail: {
                summary: "Impersonate user",
                description: "ให้แอดมินเข้าสู่ระบบแทนผู้ใช้งาน",
              },
            }
          )
    )
);
