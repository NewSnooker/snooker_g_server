import { t } from "elysia";
import { imageSchema } from "./common.schema";

export const userBodySchema = t.Object({
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
export const googleSignInSchema = t.Object({
  idToken: t.String(),
});

export const userResSchema = t.Object({
  id: t.String(),
  username: t.String(),
  email: t.String(),
  image: imageSchema,
  roles: t.Array(t.String()),
  tokenVersion: t.Number(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});
export const avatarSchema = t.Object({
  key: t.String(),
  name: t.String(),
  url: t.String(),
});
