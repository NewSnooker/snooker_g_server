import { Elysia, t } from "elysia";
import { msgSchema } from "../schema/common.schema";
import { adminService } from "@/services/admin.service";
import { authContext } from "@/interface/common.interface";
import { logger } from "@/utils/logger";
import { errMsg } from "@/config/message.error";
import { userResSchema } from "@/schema/user.schema";
import { hasAdminRole } from "@/utils/auth";

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
          if (!hasAdminRole(authUser.roles)) {
            set.status = 403;
            logger.warn("[ADMIN][beforeHandle] Forbidden: Not an admin");
            return errMsg.Forbidden;
          }
        },
      },
      (app) =>
        app
          .get(
            "/users",
            async ({ query, set }) => {
              const page = Number(query?.page) || 1;
              const limit = Number(query?.limit) || 10;
              const response = await adminService.getAllUsersPaginated(
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
                  data: t.Array(userResSchema),
                  pagination: t.Object({
                    total: t.Number(),
                    page: t.Number(),
                    limit: t.Number(),
                    totalPages: t.Number(),
                  }),
                }),
                401: msgSchema,
                403: msgSchema,
                404: msgSchema,
                500: msgSchema,
              },
              detail: {
                summary: "Get all users paginated",
                description:
                  "API สำหรับ Admin เพื่อดึงข้อมูลผู้ใช้ทั้งหมดแบบแบ่งหน้า",
              },
            }
          )
          .put(
            "/force-logout/:id",
            async ({ params, set }) => {
              const response = await adminService.forceLogoutUserById(
                params.id
              );
              set.status = response.status;
              return response;
            },
            {
              detail: {
                summary: "Force logout user",
                description:
                  "API สำหรับ Admin เพื่อบังคับให้ผู้ใช้คนหนึ่งหลุดออกจากระบบ ยกเว้นผู้ดูแลระบบหรือสูงกว่า",
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
              const logoutResponse = await adminService.forceLogoutUserById(
                params.id
              );
              if (logoutResponse.status === 200) {
                const softDeleteResponse =
                  await adminService.softDeleteUserById(params.id);
                set.status = softDeleteResponse.status;
                return softDeleteResponse;
              }
              set.status = logoutResponse.status;
              return logoutResponse;
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
                summary: "Soft delete user",
                description:
                  "API สำหรับ Admin เพื่อลบผู้ใช้จากระบบ ยกเว้นผู้ดูแลระบบหรือสูงกว่า",
              },
            }
          )
          .put(
            "/restore/:id",
            async (context) => {
              const { params, set } = context as authContext & {
                params: { id: string };
              };
              const response = await adminService.restoreUser(params.id);
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
                  "API สำหรับ Admin เพื่อกู้คืนผู้ใช้ที่ถูกลบออกจากระบบ ยกเว้นผู้ดูแลระบบหรือสูงกว่า",
              },
            }
          )
    )
);
