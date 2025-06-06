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
export const imageBodySchema = t.Object({
  key: t.String(),
  name: t.String(),
  url: t.String(),
});

export const tableQuerySchema = t.Object({
  page: t.String(),
  pageSize: t.String(),
  search: t.Optional(t.String()),
  sortBy: t.Optional(t.String()),
  sortOrder: t.Optional(t.String()),
  roles: t.Optional(t.Array(t.String())),
  isActive: t.Optional(t.Boolean()),
  createdAtStart: t.Optional(t.String()),
  createdAtEnd: t.Optional(t.String()),
});

export const tempUploadSchema = t.Object({
  id: t.String(),
  key: t.String(),
  url: t.String(),
  name: t.String(),
  uploadedById: t.String(),
  createdAt: t.Date(),
});
