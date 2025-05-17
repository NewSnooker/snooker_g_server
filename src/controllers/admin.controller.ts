import { Elysia, Static, t } from "elysia";
import { msgSchema, tableQuerySchema } from "../schema/common.schema";
import { adminService } from "@/services/admin.service";
import { authContext } from "@/interface/common.interface";
import { logger } from "@/utils/logger";
import { errMsg } from "@/config/message.error";
import { userResSchema } from "@/schema/user.schema";
import { hasAdminOrSuperAdminRole } from "@/utils/auth";
type TableQuery = Static<typeof tableQuerySchema>;
// การแบ่ง สิทธิ์ระหว่าง addmin กับ superadmin ยังไม่เสร็จ

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
        // app.get(
        //   "/users",
        //   async ({ query, set }) => {
        //     const page = Number(query?.page) || 1;
        //     const pageSize = Number(query?.pageSize) || 10;
        //     const search = query?.search;
        //     const role = query?.role;
        //     const isActive = query?.isActive
        //       ? query.isActive === "true"
        //       : undefined;
        //     const sortBy = query?.sortBy;
        //     const sortOrder = query?.sortOrder as "asc" | "desc" | undefined;

        //     const response = await adminService.getAllUsersPaginated(
        //       page,
        //       pageSize,
        //       search,
        //       role,
        //       isActive,
        //       sortBy,
        //       sortOrder
        //     );

        //     set.status = response.status;
        //     return response;
        //   },
        //   {
        //     query: tableQuerySchema,
        //     response: {
        //       200: t.Object({
        //         status: t.Number(),
        //         data: t.Array(userResSchema),
        //         pageCount: t.Number(),
        //         total: t.Number(),
        //       }),
        //       401: msgSchema,
        //       403: msgSchema,
        //       404: msgSchema,
        //       500: msgSchema,
        //     },
        //     detail: {
        //       summary: "Get all users paginated",
        //       description:
        //         "API สำหรับ Admin เพื่อดึงข้อมูลผู้ใช้ทั้งหมดแบบแบ่งหน้า รองรับการค้นหาและการกรอง",
        //     },
        //   }
        // )
        app.get(
          "/users",
          async ({ query, set }: { query: TableQuery; set: any }) => {
            const page = Number(query.page) || 1;
            const pageSize = Number(query.pageSize) || 10;
            const search = query.search;
            const roles = query.roles;
            // แปลง string "true"/"false" เป็น boolean หรือ undefined
            const isActive: boolean | undefined =
              query.isActive === undefined
                ? undefined
                : String(query.isActive) === "true";

            const sortBy = query.sortBy;
            const sortOrder = query.sortOrder as "asc" | "desc" | undefined;

            const response = await adminService.getAllUsersPaginated(
              page,
              pageSize,
              search,
              roles,
              isActive,
              sortBy,
              sortOrder
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
      // .put(
      //   "/force-logout-all",
      //   async (context) => {
      //     const { authUser, set } = context as authContext;

      //     const response = await superAdminService.forceLogoutAll(
      //       authUser.id
      //     );
      //     set.status = response.status;
      //     return response;
      //   },
      //   {
      //     response: {
      //       200: msgSchema,
      //       401: msgSchema,
      //       403: msgSchema,
      //       500: msgSchema,
      //     },
      //     detail: {
      //       summary: "Force logout all users",
      //       description:
      //         "API สำหรับ Super Admin เพื่อบังคับให้ผู้ใช้ทุกคนหลุดออกจากระบบ ยกเว้นตัวเอง",
      //     },
      //   }
      // )
      // .put(
      //   "/force-logout/:id",
      //   async ({ params, set }) => {
      //     const response = await adminService.forceLogoutUserById(
      //       params.id
      //     );
      //     set.status = response.status;
      //     return response;
      //   },
      //   {
      //     detail: {
      //       summary: "Force logout user",
      //       description:
      //         "API สำหรับ Admin เพื่อบังคับให้ผู้ใช้คนหนึ่งหลุดออกจากระบบ ยกเว้นผู้ดูแลระบบหรือสูงกว่า",
      //     },
      //     response: {
      //       200: msgSchema,
      //       400: msgSchema,
      //       401: msgSchema,
      //       403: msgSchema,
      //       404: msgSchema,
      //       500: msgSchema,
      //     },
      //   }
      // )
      // .put(
      //   "/soft-delete/:id",
      //   async (context) => {
      //     const { params, set, authUser } = context as authContext & {
      //       params: { id: string };
      //     };
      //     if (params.id === authUser.id) {
      //       set.status = 400;
      //       return errMsg.InvalidId;
      //     }
      //     const logoutResponse = await adminService.forceLogoutUserById(
      //       params.id
      //     );
      //     if (logoutResponse.status === 200) {
      //       const softDeleteResponse =
      //         await adminService.softDeleteUserById(params.id);
      //       set.status = softDeleteResponse.status;
      //       return softDeleteResponse;
      //     }
      //     set.status = logoutResponse.status;
      //     return logoutResponse;
      //   },
      //   {
      //     response: {
      //       200: msgSchema,
      //       401: msgSchema,
      //       400: msgSchema,
      //       403: msgSchema,
      //       404: msgSchema,
      //       500: msgSchema,
      //     },
      //     detail: {
      //       summary: "Soft delete user",
      //       description:
      //         "API สำหรับ Admin เพื่อลบผู้ใช้จากระบบ ยกเว้นผู้ดูแลระบบหรือสูงกว่า",
      //     },
      //   }
      // )
      // .put(
      //   "/hard-delete/:id",
      //   async (context) => {
      //     const { params, set } = context as authContext & {
      //       params: { id: string };
      //     };
      //     const response = await superAdminService.hardDeleteUserById(
      //       params.id
      //     );
      //     set.status = response.status;
      //     return response;
      //   },
      //   {
      //     response: {
      //       200: msgSchema,
      //       401: msgSchema,
      //       400: msgSchema,
      //       403: msgSchema,
      //       404: msgSchema,
      //       500: msgSchema,
      //     },
      //     detail: {
      //       summary: "Hard delete user",
      //       description:
      //         "API สำหรับ Admin เพื่อลบผู้ใช้ หรือ ผู้ดูแลระบบ ออกจากระบบ ",
      //     },
      //   }
      // )
      // .put(
      //   "/restore/:id",
      //   async (context) => {
      //     const { params, set } = context as authContext & {
      //       params: { id: string };
      //     };
      //     const response = await adminService.restoreUser(params.id);
      //     set.status = response.status;
      //     return response;
      //   },
      //   {
      //     response: {
      //       200: msgSchema,
      //       401: msgSchema,
      //       400: msgSchema,
      //       403: msgSchema,
      //       404: msgSchema,
      //       500: msgSchema,
      //     },
      //     detail: {
      //       summary: "Restore user",
      //       description:
      //         "API สำหรับ Admin เพื่อกู้คืนผู้ใช้ที่ถูกลบออกจากระบบ ยกเว้นผู้ดูแลระบบหรือสูงกว่า",
      //     },
      //   }
      // )
    )
);
