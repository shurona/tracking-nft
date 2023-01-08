import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PastEventService } from './past-event.service';
import { PastEventController } from './past-event.controller';
import { Token, EventList, Contract } from './entities';

const dbList = [Token, EventList, Contract];

@Module({
  imports: [TypeOrmModule.forFeature(dbList)],
  controllers: [PastEventController],
  providers: [PastEventService],
})
export class PastEventModule {}
