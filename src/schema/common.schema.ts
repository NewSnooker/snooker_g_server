import { t } from "elysia";

export const msgSchema = t.Object({
  status: t.Number(),
  message: t.String(),
});

export const imageSchema = t.Object({
  id: t.String(),
  key: t.String(),
  name: t.String(),
  url: t.String(),
});
