import dayjs from 'dayjs';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Opensea, TokenId, Collection, Currency, FloorPriceLog } from '../entities';
import { EventInfoType } from '../type';
import { CreateCollectionSchema } from '../dto/create-subscription.dto';

@Injectable()
export class DbUtils {
  constructor(
    @InjectRepository(Opensea)
    private opensea: Repository<Opensea>,

    @InjectRepository(TokenId)
    private tokenId: Repository<TokenId>,

    @InjectRepository(Collection)
    private collection: Repository<Collection>,

    @InjectRepository(Currency)
    private currency: Repository<Currency>,

    @InjectRepository(FloorPriceLog)
    private floorPriceLog: Repository<FloorPriceLog>,
  ) {}

  //collection의 row추가
  async createCollectionRow(eventInfo: EventInfoType, floorPrice: number) {
    return await this.collection
      .createQueryBuilder()
      .insert()
      .values([
        {
          name: eventInfo.collectionName,
          floorPrice: floorPrice,
          currency: eventInfo.currencyToken,
          expirationDate: eventInfo.expirationDate,
          address: eventInfo.contractAddress,
        },
      ])
      .execute();
  }

  createCurrencyRow(eventInfo: EventInfoType) {
    return this.currency
      .createQueryBuilder()
      .insert()
      .values([
        {
          name: eventInfo.currencyName,
          symbol: eventInfo.currencyToken,
          decimals: eventInfo.decimals,
          ethPrice: eventInfo.ethPrice,
          usdPrice: eventInfo.usdPrice,
        },
      ])
      .execute();
  }

  createTokenIdRow(eventInfo, collectionId: number) {
    return this.tokenId
      .createQueryBuilder()
      .insert()
      .values([
        {
          collection: collectionId,
          tokenNumber: eventInfo.tokenId,
          usd: eventInfo.usdPrice,
          currency: eventInfo.currencyToken,
          value: eventInfo.price,
        },
      ])
      .execute();
  }

  async findCurrentFloorPriceTokenId(collectionInfo: Collection) {
    const rst = await this.tokenId
      .createQueryBuilder()
      .select(`min(multipleValue) as multipleValue, tokenNumber as tokenId, usd as usdPrice, currency, value as price`)
      .where('collection=:collectionId', { collectionId: collectionInfo.id })
      .andWhere('value >= 0')
      .getRawOne();

    return rst;
  }

  findOverExpiration(): Promise<{ name: string }[]> {
    return this.collection
      .createQueryBuilder()
      .select('name')
      .where(`expiration_date < :todayDate`, { todayDate: dayjs().format(`YYYY-MM-DD HH:mm:ss`) })
      .getRawMany();
  }

  findFloorPriceLogsByCollection(name: string) {
    return this.collection
      .createQueryBuilder('collection')
      .leftJoinAndSelect('collection.floorPriceLogs', 'floorPriceLogs')
      .select('collection.name, floorPriceLogs.timestamp, floorPriceLogs.floor_price')
      .where('collection.name = :name', { name: name })
      .orderBy('floorPriceLogs.timestamp', 'DESC')
      .getRawMany();
  }

  //floor Price 세팅
  updateCollectionFloorPriceWithStream(eventInfo: EventInfoType, floorPrice: number, collectionNane: string) {
    return this.collection
      .createQueryBuilder()
      .update('collection')
      .set({
        currency: eventInfo.currencyToken,
        expirationDate: eventInfo.expirationDate,
        floorPrice: floorPrice,
      })
      .where(`name=:name`, { name: collectionNane })
      .execute();
  }

  //tokenNumber에 따라서 db update
  updateTokenIdByTokenNumber(eventInfo: EventInfoType) {
    return this.tokenId
      .createQueryBuilder()
      .update()
      .set({
        usd: eventInfo.usdPrice,
        currency: eventInfo.currencyToken,
        value: eventInfo.price,
      })
      .where(`tokenNumber=${eventInfo.tokenId}`)
      .execute();
  }

  updateCurrencyByCurrenyName(eventInfo: EventInfoType) {
    return this.currency
      .createQueryBuilder()
      .update()
      .set({
        ethPrice: eventInfo.ethPrice,
        usdPrice: eventInfo.usdPrice,
      })
      .where(`name=:name`, { name: eventInfo.currencyName })
      .execute();
  }

  updateCollectionFloorPriceWithOpenseaApi(collectionName: string, floorPrice: number) {
    return this.collection
      .createQueryBuilder()
      .update()
      .set({
        currency: 'ETH',
        expirationDate: dayjs().add(1, 'days').format(`YYYY-MM-DD HH:mm:ss`),
        floorPrice: floorPrice,
      })
      .where(`name=:name`, { name: collectionName })
      .execute();
  }

  resetPriceInfoByTokenId(eventInfo: EventInfoType) {
    //해당 tokenId의 price 정보를 초기화 시킨다.
    return this.tokenId
      .createQueryBuilder()
      .update()
      .set({
        usd: 0,
        currency: '',
        value: -1,
      })
      .where(`tokenNumber=:tokenNumber`, { tokenNumber: eventInfo.tokenId })
      .execute();
  }

  logFloorPrice(collectionId: number, floorPrice: number, ethPrice: number, timestamp: string) {
    return this.floorPriceLog
      .createQueryBuilder()
      .insert()
      .values([
        {
          timestamp: timestamp,
          collection: collectionId,
          floorPrice: floorPrice,
          ethPrice: ethPrice,
        },
      ])
      .execute();
  }

  // api를 통해서 collection 생성
  createCollectionTableByApi(requestBody: CreateCollectionSchema) {
    return this.collection
      .createQueryBuilder()
      .insert()
      .values([
        {
          name: requestBody.name,
          currency: requestBody.currency,
          address: requestBody.address,
          floorPrice: Number(requestBody.floorPrice) ?? 10000000000,
        },
      ])
      .execute();
  }
}
