import { t } from "elysia";

export const msgSchema = t.Object({
  status: t.Number(),
  message: t.String(),
});
