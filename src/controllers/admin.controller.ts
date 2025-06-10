import { Elysia, Static, t } from "elysia";
import {
  imageBodySchema,
  msgSchema,
  tableQuerySchema,
} from "../schema/common.schema";
import { adminService } from "@/services/admin.service";
import { authContext } from "@/interface/common.interface";
import { logger } from "@/utils/logger";
import { errMsg } from "@/config/message.error";
import {
  userBodySchema,
  userResSchema,
  userUpdateBodySchema,
} from "@/schema/user.schema";
import { hasAdminOrSuperAdminRole } from "@/utils/permission";

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
          if (!hasAdminOrSuperAdminRole(authUser.roles)) {
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
              const page = Number(query.page) || 1;
              const pageSize = Number(query.pageSize) || 10;
              const search = query.search;
              const roles = query.roles;
              const isActive: boolean | undefined =
                query.isActive === undefined
                  ? undefined
                  : String(query.isActive) === "true";
              const sortBy = query.sortBy;
              const sortOrder = query.sortOrder as "asc" | "desc" | undefined;
              const createdAtStart = query.createdAtStart;
              const createdAtEnd = query.createdAtEnd;

              const response = await adminService.getAllUsersPaginated(
                page,
                pageSize,
                search,
                roles,
                isActive,
                sortBy,
                sortOrder,
                createdAtStart,
                createdAtEnd
              );

              set.status = response.status;
              return response;
            },
            {
              query: tableQuerySchema,
              response: {
                200: t.Object({
                  status: t.Number(),
                  data: t.Array(userResSchema),
                  pageCount: t.Number(),
                  total: t.Number(),
                }),
                401: msgSchema,
                403: msgSchema,
                404: msgSchema,
                500: msgSchema,
              },
              detail: {
                summary: "Get all users paginated",
                description:
                  "API สำหรับ Admin เพื่อดึงข้อมูลผู้ใช้ทั้งหมดแบบแบ่งหน้า รองรับการค้นหาและการกรอง",
              },
            }
          )
          .put(
            "/force-logout",
            async (context) => {
              const { body, set, authUser } = context as authContext;
              const { ids } = body as { ids: string[] };
              const response = await adminService.forceLogoutUserById(
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
                  "API สำหรับ Admin เพื่อบังคับให้ผู้ใช้ทั่วไปหลายคนหลุดออกจากระบบ",
              },
            }
          )
          .delete(
            "/soft-delete",
            async (context) => {
              const { body, set, authUser } = context as authContext;
              const { ids } = body as { ids: string[] };
              const logoutResponse = await adminService.forceLogoutUserById(
                ids,
                authUser.id
              );
              if (logoutResponse.status === 200) {
                const softDeleteResponse =
                  await adminService.softDeleteUserById(ids, authUser.id);
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
                  "API สำหรับ Admin เพื่อลบผู้ใช้ทั่วไปหลายคนจากระบบ (soft delete)",
              },
            }
          )
          .put(
            "/restore",
            async (context) => {
              const { body, set, authUser } = context as authContext;
              const { ids } = body as { ids: string[] };
              const response = await adminService.restoreUser(ids, authUser.id);
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
                  "API สำหรับ Admin เพื่อกู้คืนผู้ใช้ทั่วไปหลายคนที่ถูกลบ",
              },
            }
          )
          .post(
            "create-user",
            async (context) => {
              const { body, set } = context as authContext;
              const { user } = body as {
                user: Static<typeof userBodySchema> & {
                  image: Static<typeof imageBodySchema>;
                };
              };
              const response = await adminService.createUser(user);
              set.status = response.status;
              return response;
            },
            {
              body: t.Object({
                user: t.Intersect([
                  userBodySchema,
                  t.Object({ image: imageBodySchema }),
                ]),
              }),
              response: {
                201: msgSchema,
                400: msgSchema,
                401: msgSchema,
                403: msgSchema,
                404: msgSchema,
                500: msgSchema,
              },
              detail: {
                summary: "Create user",
                description: "API สำหรับ Admin เพื่อสร้างผู้ใช้ทั่วไปใหม่",
              },
            }
          )
          .put(
            "user/:id",
            async ({ body, set, params: { id } }) => {
              const user = body as Static<typeof userUpdateBodySchema>;
              const payload = {
                id,
                email: user.email,
                username: user.username,
              };
              const response = await adminService.updateUser(payload);
              set.status = response.status;
              return response;
            },
            {
              params: t.Object({ id: t.String() }),
              body: userUpdateBodySchema,
              response: {
                200: msgSchema,
                400: msgSchema,
                401: msgSchema,
                403: msgSchema,
                404: msgSchema,
                500: msgSchema,
              },
              detail: {
                summary: "Update user",
                description: "API สำหรับ Admin เพื่ออัปเดตข้อมูลผู้ใช้ทั่วไป",
              },
            }
          )
    )
);
