import { Role } from "@prisma/client";

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
