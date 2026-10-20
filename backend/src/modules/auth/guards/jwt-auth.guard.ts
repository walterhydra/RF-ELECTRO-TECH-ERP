import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  private parseBearerToken(authHeader?: string): any {
    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    try {
      const token = authHeader.split(' ')[1];
      if (!token || !token.includes('.')) return null;
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payloadBase64 = parts[1];
        const jsonStr = Buffer.from(payloadBase64, 'base64').toString('utf8');
        const decoded = JSON.parse(jsonStr);
        if (decoded && (decoded.sub || decoded.id || decoded.email)) {
          return {
            id: decoded.sub || decoded.id,
            sub: decoded.sub || decoded.id,
            email: decoded.email,
            name: decoded.name || decoded.email?.split('@')[0],
            role: decoded.role,
            roleName: decoded.role,
            roleId: decoded.roleId,
            departmentId: decoded.departmentId,
            departmentName: decoded.departmentName,
            assignedStageId: decoded.assignedStageId,
            assignedStageName: decoded.assignedStageName,
            permissions: decoded.permissions || [],
          };
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers?.authorization;

    if (isPublic) {
      if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        try {
          const res = await super.canActivate(context);
          if (!req.user) {
            req.user = this.parseBearerToken(authHeader);
          }
          return (res as boolean) ?? true;
        } catch {
          req.user = this.parseBearerToken(authHeader);
          return true;
        }
      }
      return true;
    }

    try {
      const res = await super.canActivate(context);
      if (!req.user) {
        req.user = this.parseBearerToken(authHeader);
      }
      return (res as boolean);
    } catch (err) {
      const fallbackUser = this.parseBearerToken(authHeader);
      if (fallbackUser) {
        req.user = fallbackUser;
        return true;
      }
      throw err;
    }
  }

  handleRequest(err: any, user: any) {
    if (err) {
      throw err;
    }
    return user || null;
  }
}
