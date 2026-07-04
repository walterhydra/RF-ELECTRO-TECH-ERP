import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getRejectionSummary() {
    // A query grouping by stage and qcReviewStatus (e.g. APPROVED_SCRAP vs APPROVED_REWORK)
    // Prisma grouping by stageId, but we might want more details, so we can fetch all and group in memory 
    // or use groupBy if suitable. Let's fetch the detailed movements with qtyRejected > 0
    const rejections = await this.prisma.stageMovementLog.findMany({
      where: {
        qtyRejected: { gt: 0 }
      },
      include: {
        stage: { select: { name: true, code: true } },
        subJobCard: {
          select: {
            jobCard: {
              select: {
                product: { select: { code: true, name: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // We can group them by stage for the frontend
    const summaryByStage: Record<string, any> = {};

    for (const r of rejections) {
      const stageName = r.stage?.name || 'Unknown Stage';
      if (!summaryByStage[stageName]) {
        summaryByStage[stageName] = {
          stageName,
          totalRejected: 0,
          totalScrapped: 0,
          totalReworked: 0,
          pendingReview: 0,
          reasons: {}
        };
      }

      const summary = summaryByStage[stageName];
      summary.totalRejected += r.qtyRejected;

      if (r.qcReviewStatus === 'APPROVED_SCRAP') summary.totalScrapped += r.qtyRejected;
      else if (r.qcReviewStatus === 'APPROVED_REWORK') summary.totalReworked += r.qtyRejected;
      else summary.pendingReview += r.qtyRejected;

      if (r.rejectionReason) {
        summary.reasons[r.rejectionReason] = (summary.reasons[r.rejectionReason] || 0) + r.qtyRejected;
      }
    }

    return Object.values(summaryByStage);
  }

  async getReworkStatus() {
    // Rework sub job cards have isRework = true
    return this.prisma.subJobCard.findMany({
      where: {
        isRework: true
      },
      include: {
        currentStage: { select: { name: true, code: true } },
        jobCard: {
          include: {
            product: { select: { code: true, name: true } },
            customerPO: { include: { customer: { select: { companyName: true } } } }
          }
        },
        parentSubJobCard: { select: { subJobCardNo: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
  async getDailyProduction() {
    const movements = await this.prisma.stageMovementLog.findMany({
      include: {
        stage: { select: { name: true, code: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const dailyByStage: Record<string, any> = {};

    for (const m of movements) {
      const dateKey = m.createdAt.toISOString().split('T')[0];
      const stageName = m.stage?.name || 'Unknown';
      const key = `${dateKey}_${stageName}`;

      if (!dailyByStage[key]) {
        dailyByStage[key] = {
          date: dateKey,
          stageName,
          qtyReceived: 0,
          qtyProcessed: 0,
          qtyForwarded: 0,
          qtyRejected: 0
        };
      }

      dailyByStage[key].qtyReceived += m.qtyReceived;
      dailyByStage[key].qtyProcessed += m.qtyProcessed;
      dailyByStage[key].qtyForwarded += m.qtyForwarded;
      dailyByStage[key].qtyRejected += m.qtyRejected;
    }

    return Object.values(dailyByStage).sort((a: any, b: any) => b.date.localeCompare(a.date));
  }

  async getWip() {
    const activeSubCards = await this.prisma.subJobCard.findMany({
      where: {
        status: { in: ['PENDING_LAUNCH', 'IN_STAGE', 'ON_HOLD'] }
      },
      include: {
        currentStage: { select: { name: true, code: true } },
        jobCard: { select: { jobCardNo: true, product: { select: { name: true } } } }
      }
    });

    const wipByStage: Record<string, any> = {};

    for (const card of activeSubCards) {
      const stageName = card.currentStage?.name || 'Pending Launch';
      if (!wipByStage[stageName]) {
        wipByStage[stageName] = {
          stageName,
          totalLots: 0,
          totalQty: 0,
          lots: []
        };
      }
      wipByStage[stageName].totalLots += 1;
      // Pending qty is what is available to forward + what is held
      const pendingQty = Math.max(0, card.qtyProcessed - card.qtyHold) + card.qtyHold + (card.qty - card.qtyReceived);
      // Wait, WIP is essentially the card's entire active quantity. Let's just use card.qty
      wipByStage[stageName].totalQty += card.qty;
      wipByStage[stageName].lots.push({
        subJobCardNo: card.subJobCardNo,
        productName: card.jobCard?.product?.name,
        qty: card.qty
      });
    }

    return Object.values(wipByStage);
  }

  async getJobCards() {
    return this.prisma.jobCard.findMany({
      include: {
        product: { select: { code: true, name: true } },
        customerPO: { select: { poNo: true, customer: { select: { companyName: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getDispatch() {
    return this.prisma.dispatch.findMany({
      include: {
        jobCard: {
          select: { jobCardNo: true, product: { select: { name: true } }, customerPO: { select: { customer: { select: { companyName: true } } } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getOrders() {
    return this.prisma.customerPO.findMany({
      include: {
        customer: { select: { companyName: true } },
        product: { select: { code: true, name: true } },
        jobCards: { select: { totalQty: true, status: true } }
      },
      orderBy: { poDate: 'desc' }
    });
  }

  async getTraceability(jobCardNo: string) {
    // Determine if it's a sub-job card or a main job card
    const isSubJobCard = jobCardNo.includes('-');
    
    if (isSubJobCard) {
      const subCard = await this.prisma.subJobCard.findUnique({
        where: { subJobCardNo: jobCardNo },
        include: {
          jobCard: { select: { jobCardNo: true, product: { select: { name: true } } } },
          currentStage: { select: { name: true } },
          movements: {
            include: { stage: { select: { name: true } }, createdBy: { select: { name: true } } },
            orderBy: { createdAt: 'asc' }
          },
          parentSubJobCard: { select: { subJobCardNo: true } },
          childSubJobCards: { select: { subJobCardNo: true } }
        }
      });
      return { type: 'SUB_JOB_CARD', data: subCard };
    } else {
      const jobCard = await this.prisma.jobCard.findUnique({
        where: { jobCardNo },
        include: {
          product: { select: { name: true } },
          subJobCards: {
            include: {
              currentStage: { select: { name: true } },
              movements: {
                include: { stage: { select: { name: true } }, createdBy: { select: { name: true } } },
                orderBy: { createdAt: 'asc' }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });
      return { type: 'JOB_CARD', data: jobCard };
    }
  }

  async exportData(type: string) {
    let data: any[] = [];
    if (type === 'orders') {
      data = await this.getOrders();
    } else if (type === 'job-cards') {
      data = await this.getJobCards();
    } else if (type === 'dispatch') {
      data = await this.getDispatch();
    } else {
      data = [{ error: 'Invalid export type' }];
    }

    if (data.length === 0) return 'No Data';

    // Basic CSV conversion
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(obj => 
      Object.values(obj).map(v => typeof v === 'object' ? JSON.stringify(v) : v).join(',')
    ).join('\n');
    return `${headers}\n${rows}`;
  }
}
