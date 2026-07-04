import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DispatchesService {
  constructor(private prisma: PrismaService) {}

  async createDispatch(data: any, userId: string) {
    const jobCard = await this.prisma.jobCard.findUnique({
      where: { id: data.jobCardId },
      include: { customerPO: true }
    });

    if (!jobCard) {
      throw new NotFoundException('Job Card not found');
    }

    if (jobCard.status !== 'COMPLETED' && jobCard.status !== 'READY_FOR_DISPATCH') {
      throw new BadRequestException('Job Card is not ready for dispatch');
    }

    // Generate unique Dispatch No
    const count = await this.prisma.dispatch.count();
    const dispatchNo = `DSP-${String(count + 1).padStart(4, '0')}`;

    const dispatch = await this.prisma.dispatch.create({
      data: {
        dispatchNo,
        jobCardId: data.jobCardId,
        dispatchedQty: data.dispatchedQty,
        destination: data.destination,
        vehicleNo: data.vehicleNo,
        courierName: data.courierName,
        deliveryPartner: data.deliveryPartner,
        driverName: data.driverName,
        contactNumber: data.contactNumber,
        trackingLrNo: data.trackingLrNo,
        dispatchRemarks: data.dispatchRemarks,
        createdById: userId,
      }
    });

    // Update JobCard Status
    await this.prisma.jobCard.update({
      where: { id: data.jobCardId },
      data: { status: 'DISPATCHED' }
    });

    // Create Notification for Customer Portal
    if (jobCard.customerPO?.customerId) {
      const portalUsers = await this.prisma.customerPortalAccess.findMany({
        where: { customerId: jobCard.customerPO.customerId }
      });

      for (const portalUser of portalUsers) {
        await this.prisma.notification.create({
          data: {
            recipientCustomerId: portalUser.id,
            type: 'DISPATCH_ALERT',
            title: `Order Dispatched: ${dispatchNo}`,
            message: `Your order for Job Card ${jobCard.jobCardNo} has been dispatched. Qty: ${data.dispatchedQty}. Tracking: ${data.trackingLrNo || 'N/A'}.`,
            referenceEntityType: 'Dispatch',
            referenceEntityId: dispatch.id
          }
        });
      }
    }

    return dispatch;
  }

  async updateDeliveryStatus(id: string, data: any) {
    const dispatch = await this.prisma.dispatch.findUnique({
      where: { id },
      include: { jobCard: { include: { customerPO: true } } }
    });

    if (!dispatch) {
      throw new NotFoundException('Dispatch not found');
    }

    const updated = await this.prisma.dispatch.update({
      where: { id },
      data: {
        deliveryStatus: data.deliveryStatus,
        deliveryPhotoUrl: data.deliveryPhotoUrl,
        deliveredByName: data.deliveredByName,
        deliveredAt: data.deliveryStatus === 'DELIVERED' ? new Date() : null,
        receiverName: data.receiverName,
        receiverMobile: data.receiverMobile,
        deliveryRemarks: data.deliveryRemarks,
        failureReason: data.failureReason,
      }
    });

    if (data.deliveryStatus === 'DELIVERED') {
      await this.prisma.jobCard.update({
        where: { id: dispatch.jobCardId },
        data: { status: 'DELIVERED' }
      });

      // Notify customer of delivery
      if (dispatch.jobCard?.customerPO?.customerId) {
        const portalUsers = await this.prisma.customerPortalAccess.findMany({
          where: { customerId: dispatch.jobCard.customerPO.customerId }
        });

        for (const portalUser of portalUsers) {
          await this.prisma.notification.create({
            data: {
              recipientCustomerId: portalUser.id,
              type: 'DELIVERY_CONFIRMED',
              title: `Order Delivered: ${dispatch.dispatchNo}`,
              message: `Your order for Job Card ${dispatch.jobCard.jobCardNo} has been delivered successfully. Receiver: ${data.receiverName || 'N/A'}.`,
              referenceEntityType: 'Dispatch',
              referenceEntityId: dispatch.id
            }
          });
        }
      }
    }

    return updated;
  }

  async getAllDispatches() {
    return this.prisma.dispatch.findMany({
      include: {
        jobCard: {
          select: { jobCardNo: true, product: { select: { name: true } }, customerPO: { select: { customer: { select: { companyName: true } } } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
