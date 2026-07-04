import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RoleCode } from '@prisma/client';

@Injectable()
export class StageScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Admins, Planners, and Engineers can bypass stage-level restrictions
    if (
      user.role === RoleCode.SUPER_ADMIN ||
      user.roleName === RoleCode.SUPER_ADMIN ||
      user.roleName === RoleCode.PRODUCTION_PLANNER ||
      user.roleName === RoleCode.PRODUCT_ENGINEER ||
      user.roleName === RoleCode.QC_OFFICER
    ) {
      return true;
    }

    // If Process Operator, ensure they have an assignedStageId matching the request body/param
    if (user.roleName === RoleCode.PROCESS_OPERATOR) {
      const targetStageId = request.body?.stageId || request.params?.stageId || request.query?.stageId;
      if (targetStageId && user.assignedStageId !== targetStageId) {
        throw new ForbiddenException('You are only authorized to log movements for your assigned process stage.');
      }
    }

    return true;
  }
}
