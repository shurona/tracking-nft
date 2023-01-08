import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PastEventModule } from './past-event/past-event.module';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PastEventModule,
    SubscriptionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
