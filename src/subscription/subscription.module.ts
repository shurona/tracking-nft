import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { Collection, Opensea, TokenId, Currency, FloorPriceLog } from './entities';
import { DbUtils } from './utils/dbUtils';

const dbList = [Opensea, Collection, TokenId, Currency, FloorPriceLog];

@Module({
  imports: [TypeOrmModule.forFeature(dbList)],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, DbUtils],
})
export class SubscriptionModule {}
