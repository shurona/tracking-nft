import { Controller, Get, Query, Headers, Param, Delete } from '@nestjs/common';
import { PastEventService } from './past-event.service';

@Controller('past-event')
export class PastEventController {
  constructor(private readonly pastEventService: PastEventService) {}

  @Get()
  async findAll(@Headers('address') address: string, @Headers('chain') chain: string, @Headers('tokenId') tokenId: string) {
    return await this.pastEventService.findAll(address, tokenId, chain);
  }

  @Get('check')
  async checkContract(@Headers('address') address: string, @Headers('chain') chain: string, @Headers('tokenId') tokenId: string) {
    return await this.pastEventService.check721(address, tokenId, chain);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pastEventService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pastEventService.remove(+id);
  }
}
