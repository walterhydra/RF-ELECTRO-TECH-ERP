import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { PortalModule } from './modules/portal/portal.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ProcessStagesModule } from './modules/process-stages/process-stages.module';
import { ProductMasterModule } from './modules/product-master/product-master.module';
import { CustomerPosModule } from './modules/customer-pos/customer-pos.module';
import { JobCardsModule } from './modules/job-cards/job-cards.module';
import { SubJobCardsModule } from './modules/sub-job-cards/sub-job-cards.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { RejectionsModule } from './modules/rejections/rejections.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DispatchesModule } from './modules/dispatches/dispatches.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    PortalModule,
    UsersModule,
    CustomersModule,
    ProcessStagesModule,
    ProductMasterModule,
    CustomerPosModule,
    JobCardsModule,
    SubJobCardsModule,
    RejectionsModule,
    ReportsModule,
    DispatchesModule,
    NotificationsModule,
    AuditLogsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
