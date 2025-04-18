import { t } from "elysia";

export const userBody = t.Object({
  username: t.String({ minLength: 5, maxLength: 20 }),
  email: t.String({ pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" }),
  password: t.String({
    minLength: 8,
    maxLength: 20,
    pattern: "^[a-zA-Z0-9!@#$%^&*()_+\\-=]{8,20}$",
  }),
});
export const userBodyLogin = t.Object({
  email: t.String({ pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" }),
  password: t.String({
    minLength: 8,
    maxLength: 20,
    pattern: "^[a-zA-Z0-9!@#$%^&*()_+\\-=]{8,20}$",
  }),
});

export const userRes = t.Object({
  id: t.String(),
  username: t.String(),
  email: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});
