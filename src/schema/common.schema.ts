import { t } from "elysia";

export const msgSchema = t.Object({
  status: t.String(),
  message: t.String(),
});
