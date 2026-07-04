import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers, user, body } = request;
    const userAgent = headers['user-agent'] || '';
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: async (data) => {
          // Log mutating HTTP methods per 11_CODING_RULES.md
          if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            try {
              await this.prisma.auditLog.create({
                data: {
                  userId: user?.id || null,
                  action: `${method}_${url.split('/')[3]?.toUpperCase() || 'UNKNOWN'}`,
                  entityType: url.split('/')[3] || 'GENERAL',
                  entityId: body?.id || data?.id || null,
                  newValuesJson: data ? JSON.stringify(data) : null,
                  ipAddress: ip,
                  userAgent: userAgent,
                },
              });
            } catch (err) {
              this.logger.error('Failed to write audit log:', err);
            }
          }
        },
      }),
    );
  }
}
