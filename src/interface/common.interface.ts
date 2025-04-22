import { Context, StatusMap } from "elysia";
import { Cookie, ElysiaCookie } from "elysia/dist/cookies";
import { HTTPHeaders } from "elysia/dist/types";

export interface authContext extends Context {
  authUser: { id: string; tokenVersion: number }; // Define authUser with proper structure
}

export interface loggerContext extends Context {
  logger: any; // Add the logger property to the Context type
}
export interface set {
  headers: HTTPHeaders;
  status?: number | keyof StatusMap;
  redirect?: string;
  cookie?: Record<string, ElysiaCookie>;
}
export interface auth {
  auth: Cookie<string | undefined>;
}
