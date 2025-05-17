import { Role } from "@prisma/client";
import { logger } from "./logger";
import { errMsg } from "@/config/message.error";

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

export function denyIfAdminOrSuperAdmin(roles: Role[]) {
  if (hasAdminOrSuperAdminRole(roles)) {
    logger.warn(
      "[ADMIN][denyIfAdminOrSuperAdmin] Forbidden - Admin/SuperAdmin cannot be logged out"
    );
    return errMsg.Forbidden;
  }
}
