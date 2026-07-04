import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { RoleCode } from '@prisma/client';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Rule 9: MIS_VIEWER is read-only. Block any mutating HTTP method (POST, PUT, PATCH, DELETE)
    const method = request.method?.toUpperCase();
    if (user.role === RoleCode.MIS_VIEWER || user.roleName === RoleCode.MIS_VIEWER) {
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        throw new ForbiddenException('MIS Viewer access is strictly read-only. Data modification is prohibited.');
      }
    }

    // SUPER_ADMIN has unrestricted bypass access across all internal modules
    if (user.role === RoleCode.SUPER_ADMIN || user.roleName === RoleCode.SUPER_ADMIN) {
      return true;
    }

    // Check if user's JWT permissions payload contains the required permission keys
    const userPermissions: string[] = user.permissions || [];
    const hasPermission = requiredPermissions.some((perm) => userPermissions.includes(perm));

    if (!hasPermission) {
      throw new ForbiddenException(`Access denied. Missing required permission(s): ${requiredPermissions.join(', ')}`);
    }

    return true;
  }
}
