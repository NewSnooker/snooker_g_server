import { t } from "elysia";

export const userSchema = t.Object({
  username: t.String({ minLength: 5, maxLength: 20 }),
  email: t.String({
    pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
    minLength: 5,
    maxLength: 30,
  }),
  password: t.String({
    minLength: 8,
    maxLength: 20,
    pattern: "[a-zA-Z0-9]{8,20}",
  }),
});
export const userSignInSchema = t.Object({
  email: t.String({
    pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
    minLength: 5,
    maxLength: 30,
  }),
  password: t.String({
    minLength: 8,
    maxLength: 20,
    pattern: "[a-zA-Z0-9]{8,20}",
  }),
});

export const userRes = t.Object({
  id: t.String(),
  username: t.String(),
  email: t.String(),
  imageUrl: t.Union([t.String(), t.Null()]), // <--- อนุญาตให้เป็น null ได้
  tokenVersion: t.Number(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});
