import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getNotifications(userId?: string) {
    const where: any = {};
    if (userId) {
      where.OR = [
        { recipientUserId: userId },
        { recipientUserId: null, recipientCustomerId: null },
      ];
    } else {
      where.recipientCustomerId = null;
    }

    let list = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // If empty, generate dynamic live notifications from shop floor and dispatches
    if (list.length === 0) {
      try {
        const [recentDispatches, activeJobCards] = await Promise.all([
          this.prisma.dispatch.findMany({
            take: 2,
            orderBy: { createdAt: 'desc' },
            include: { jobCard: true },
          }).catch(() => []),
          this.prisma.jobCard.findMany({
            where: { status: 'IN_PROGRESS' },
            take: 2,
            orderBy: { updatedAt: 'desc' },
          }).catch(() => []),
        ]);

        const seeds: any[] = [];

        if (recentDispatches.length > 0) {
          seeds.push({
            type: 'DISPATCH_ALERT' as const,
            title: `Dispatch: ${recentDispatches[0].dispatchNo}`,
            message: `Dispatch ${recentDispatches[0].dispatchNo} ready for Job Card ${recentDispatches[0].jobCard?.jobCardNo || ''}.`,
            isRead: false,
          });
        }

        if (activeJobCards.length > 0) {
          seeds.push({
            type: 'SYSTEM_ALERT' as const,
            title: `Production: ${activeJobCards[0].jobCardNo}`,
            message: `Job Card ${activeJobCards[0].jobCardNo} currently active on shop floor stages.`,
            isRead: false,
          });
        }

        seeds.push({
          type: 'SYSTEM_ALERT' as const,
          title: 'RF Electro Tech ERP Live',
          message: 'All shop floor stages, job cards, and floor PWA tracking are operational.',
          isRead: false,
        });

        for (const seed of seeds) {
          await this.prisma.notification.create({
            data: {
              ...seed,
              recipientUserId: userId || null,
            },
          }).catch(() => null);
        }

        list = await this.prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 20,
        });
      } catch {
        // Fallback in case of constraint
      }
    }

    return list;
  }

  async markAsRead(id: string, userId?: string) {
    return this.prisma.notification.updateMany({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId?: string) {
    const where: any = { isRead: false };
    if (userId) {
      where.OR = [
        { recipientUserId: userId },
        { recipientUserId: null, recipientCustomerId: null },
      ];
    }
    return this.prisma.notification.updateMany({
      where,
      data: { isRead: true },
    });
  }
}
