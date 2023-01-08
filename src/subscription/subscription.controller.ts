import { Controller, Get, Put, Headers, Post } from '@nestjs/common';
import { ApiOperation, ApiHeader, ApiResponse } from '@nestjs/swagger';

import { CreateCollectionSchema } from './dto/create-subscription.dto';
import { FloorPriceUpdate } from './dto/update-subscription.dto';
import { SubscriptionService } from './subscription.service';
import { FloorPriceOutputRespnose } from './entities';

@Controller('subscription')
@ApiHeader({ name: '', description: '', required: false })
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  async addSubscription(@Headers('contractName') contractName: string, @Headers('contractAddress') contractAddress: string) {
    return 'subscription of infura';
    // return this.subscriptionService.addSubscription(contractName, contractAddress);
  }

  @Get('list')
  @ApiOperation({ description: `구독된 리스트를 갖고 온다.` })
  @ApiResponse({ status: 200, description: `구독된 리스트`, type: 'array' })
  async getSubScriptionList() {
    return this.subscriptionService.getSubscription();
  }

  @Post('opensea')
  @ApiOperation({ description: `opensea stream api로 구독을 추가한다.` })
  @ApiResponse({ status: 200, description: `현재 까지 구독된 리스트를 리턴`, type: 'array' })
  async addOpenseaSubscription(@Headers('collection') collectionName: string) {
    if (!collectionName) {
      return 'Enter collectionName for subscription';
    }

    //collectionName이 여러개 들어왔거나 한 개 들어왔을 때 나눠준다. 없으면 빈 값 이라 반환
    const collectionArray = collectionName.split(',');
    let subscribeCollections: any;
    if (collectionArray.length > 1) {
      for (let i = 0; i < collectionArray.length; i++) {
        subscribeCollections = await this.subscriptionService.addOpenseaSub(collectionArray[i].trim());
      }
      return subscribeCollections;
    } else if (collectionArray.length === 1) {
      return this.subscriptionService.addOpenseaSub(collectionName);
    } else {
      return collectionName;
    }
  }

  @Put('unsubscribe')
  @ApiOperation({ description: `opensea stream api에서 구독을 해제한다.` })
  @ApiResponse({ status: 200, description: `성공 여부를 전달한다.`, type: Boolean })
  async unsubscribeOpensea(@Headers('collection') collectionName: string) {
    return this.subscriptionService.unSubOpensea(collectionName);
  }

  @Get('collections/info')
  @ApiOperation({ description: `collection들의 floor Price를 불러온다.` })
  @ApiResponse({
    status: 200,
    description: `collection들은 Floor Price Object List`,
    type: FloorPriceOutputRespnose,
  })
  async getFloorPrice() {
    return this.subscriptionService.getFloorPrice();
  }

  @Get('collection/floorprice')
  async getCollectionFloorPriceLogs(@Headers('collection') collectionName: string) {
    return await this.subscriptionService.getCollectionFloorPriceLogs(collectionName);
  }

  // @Get('parse')
  // async parseSubscribeList() {
  //   return this.subscriptionService.parseData();
  // }

  // @Post('floorprice')
  // async createCollectionInfo(@Body() body: CreateCollectionSchema) {
  //   return await this.subscriptionService.createCollectionTableByApi(body);
  // }
}
