import { Elysia, t } from "elysia";
import { commonService } from "@/services/common.service";
import { msgSchema, tempUploadSchema } from "../schema/common.schema";
import { authContext } from "@/interface/common.interface";
import { errMsg } from "@/config/message.error";
import { logger } from "@/utils/logger";

export const commonController = new Elysia().group(
  "",
  { tags: ["Common"] },
  (app) =>
    app.guard(
      {
        beforeHandle: (context) => {
          const { authUser, set } = context as authContext;
          if (!authUser) {
            set.status = 401;
            logger.warn("[COMMON][beforeHandle] Unauthorized");
            return errMsg.Unauthorized;
          }
        },
      },
      (app) =>
        app
          .post(
            "temp-upload",
            async (context) => {
              const { authUser, body, set } = context as authContext;
              const { key, name, url } = body as {
                key: string;
                name: string;
                url: string;
              };

              const response = await commonService.createTempUpload(
                key,
                name,
                url,
                authUser.id
              );
              set.status = response.status;
              return response;
            },
            {
              body: t.Object({
                key: t.String(),
                name: t.String(),
                url: t.String(),
              }),
              response: {
                200: msgSchema,
                404: msgSchema,
                400: msgSchema,
                500: msgSchema,
              },
              detail: {
                summary: "Create temp upload",
                description:
                  "API สำหรับผู้ใช้เพื่อสร้างข้อมูลไฟล์ในระบบแบบชั่วคราว",
              },
            }
          )
          .get(
            "temp-upload",
            async (context) => {
              const { authUser, set } = context as authContext;
              const response = await commonService.getTempUploadByUserId(
                authUser.id
              );
              set.status = response.status;
              return response;
            },
            {
              response: {
                200: t.Object({
                  status: t.Number(),
                  data: t.Array(tempUploadSchema),
                }),
                400: msgSchema,
                404: msgSchema,
                500: msgSchema,
              },
              detail: {
                summary: "Get temp upload by userId",
                description:
                  "API สำหรับผู้ใช้เพื่อดูข้อมูลไฟล์ในระบบแบบชั่วคราว",
              },
            }
          )
          .delete(
            "temp-upload",
            async (context) => {
              const { authUser, set } = context as authContext;
              const response = await commonService.deleteTempUploadByUserId(
                authUser.id
              );
              set.status = response.status;
              return response;
            },
            {
              response: {
                200: msgSchema,
                400: msgSchema,
                404: msgSchema,
                500: msgSchema,
              },
              detail: {
                summary: "Delete temp upload by userId",
                description:
                  "API สำหรับผู้ใช้เพื่อลบข้อมูลไฟล์ในระบบแบบชั่วคราว",
              },
            }
          )
    )
);
