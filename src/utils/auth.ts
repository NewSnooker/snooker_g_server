import { Role } from "@prisma/client";
import { logger } from "./logger";
import { errMsg } from "@/config/message.error";
import { error } from "elysia";

export function hasRequiredRole(roles: Role[], requiredRoles: Role[]): boolean {
  return roles.some((role) => requiredRoles.includes(role));
}
export function hasUserRole(roles: Role[]): boolean {
  return hasRequiredRole(roles, [Role.USER]);
}
export function hasAdminRole(roles: Role[]): boolean {
  return hasRequiredRole(roles, [Role.SUPER_ADMIN]);
}
export function hasSuperAdminRole(roles: Role[]): boolean {
  return hasRequiredRole(roles, [Role.SUPER_ADMIN]);
}
export function hasAdminOrSuperAdminRole(roles: Role[]): boolean {
  return hasRequiredRole(roles, [Role.SUPER_ADMIN, Role.ADMIN]);
}
export function validateRoles(roles: Role[]): void {
  if (roles && roles.length > 0) {
    const validRoles = [Role.USER, Role.ADMIN, Role.SUPER_ADMIN];
    const invalidRoles = roles.filter((role) => !validRoles.includes(role));
    if (invalidRoles.length > 0) {
      throw error(400, `Invalid roles: ${invalidRoles.join(", ")}`);
    }
  }
}
