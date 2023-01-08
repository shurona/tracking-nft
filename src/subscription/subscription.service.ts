import Web3 from 'web3';
import axios from 'axios';
import dayjs from 'dayjs';
import { Repository } from 'typeorm';
import { WebSocket } from 'ws';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { OpenSeaStreamClient, EventType, Network } from '@opensea/stream-js';

import Queue from './utils/queue';
import { FloorPriceUpdate } from './dto/update-subscription.dto';
import { ABI_721 } from '../abis';
import { Collection, Opensea, TokenId, Currency } from './entities';
import { OpenseaEventType, EventInfoType } from './type';
import { DbUtils } from './utils/dbUtils';

@Injectable()
export class SubscriptionService {
  subObj: Record<string, any>;
  collectionExpirationDate: Record<string, any>;
  client: OpenSeaStreamClient;
  eventQueue: Queue;
  nullPollingCount: number;
  pollingStatus: boolean;
  expirationFindQueryData: string;

  MAX_NULL_POLLING_COUNT = 10;

  constructor(
    @InjectRepository(Opensea)
    private opensea: Repository<Opensea>,

    @InjectRepository(TokenId)
    private tokenId: Repository<TokenId>,

    @InjectRepository(Collection)
    private collection: Repository<Collection>,

    @InjectRepository(Currency)
    private currency: Repository<Currency>,

    private readonly configService: ConfigService,

    private dbUtils: DbUtils,
  ) {
    this.client = new OpenSeaStreamClient({
      network: Network.MAINNET,
      token: this.configService.get('OPENSEA_API_KEY'),
      connectOptions: {
        transport: WebSocket,
      },
    });
    this.subObj = {};
    this.collectionExpirationDate = {};
    this.eventQueue = new Queue();
    this.nullPollingCount = this.MAX_NULL_POLLING_COUNT;
    this.pollingStatus = false;
    this.expirationFindQueryData = dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm:ss');
  }

  //chain을 사용한 subscription
  async addSubscription(contractName: string, contractAddress: string) {
    const infraUrl = 'wss://mainnet.infura.io/ws/v3/48e12be981d24ce3a35a2368e5823f4d';
    const web3 = new Web3(infraUrl);

    const doodlesAddress = '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e';

    const contract = new web3.eth.Contract(ABI_721, doodlesAddress);

    const options = {
      // Transfer
      topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'],
    };

    console.log(SubscriptionService.name);
    console.log(contract.options.address);

    const subscription = web3.eth.subscribe(
      'logs',
      {
        address: [contract.options.address, `0xed5af388653567af2f388e6224dc7c4b3241c544`],
        // topics : []
      },
      (error, result) => {
        if (error) {
          console.log(error);
          return '에라핫세';
        }
        console.log('web3 두들즈');
        console.log(result);
      },
    );

    this.subObj[`doodles`] = subscription;

    return 'on Listening ' + this.subObj['doodles'];
  }

  async delSubscription(contractName: string) {
    this.subObj[contractName].unsubscribe((err, success) => {
      if (success) {
        console.log(`Successfully unsubscribed!`);
      }
    });
  }

  //opensea stream을 사용한 subscripiton
  async addOpenseaSub(collectionName: string) {
    const eventList = [
      // EventType.ITEM_RECEIVED_OFFER,
      EventType.ITEM_CANCELLED,
      EventType.ITEM_LISTED,
      // EventType.ITEM_METADATA_UPDATED,
      // EventType.ITEM_RECEIVED_BID,
      EventType.ITEM_TRANSFERRED,
      EventType.ITEM_SOLD,
    ];

    if (this.subObj[collectionName] !== undefined) {
      console.log(`이미 존재하는 collection 입니다.`);
      return;
    }

    //opensea streaming
    const eventObject = this.client.onEvents(collectionName, eventList, (event) => {
      this.pushQueue(event);
    });

    this.subObj[collectionName] = eventObject;
    console.log(this.subObj);
    return Object.keys(this.subObj);
  }

  async startPolling() {
    //빈 폴링이 10번 연속으로 넘어오면 polling을 종료한다
    if (this.nullPollingCount >= this.MAX_NULL_POLLING_COUNT) {
      this.pollingStatus = false;
      return;
    }
    setTimeout(() => {
      const queuePopData = this.eventQueue.pop();
      if (queuePopData !== undefined) {
        try {
          if (queuePopData.eventName === 'collectionRefresh') {
            this.setExpirationCollection(queuePopData.item);
          } else {
            this.checkFloorPrice(queuePopData.item);
            //이벤트 정보를 통으로 저장
            this.eventSave(queuePopData.item);
          }
        } catch (e) {
          console.log(`확인 좀 : ` + e);
          this.nullPollingCount++;
        }
      } else {
        this.nullPollingCount++;
      }
      this.startPolling();
    }, 300);
  }

  //queue에 정보 추가
  pushQueue(event) {
    //queue에 데이터를 넣고
    this.eventQueue.push(event.event_type, event);

    if (!this.pollingStatus) {
      //pollingCount를 초기화 한다.
      this.nullPollingCount = 0;
      this.pollingStatus = true;
      //폴링 시작
      this.startPolling();
    }
  }

  async unSubOpensea(collectionName: string) {
    if (this.subObj[collectionName]) {
      this.subObj[collectionName]();
      delete this.subObj[collectionName];
      console.log('Success unsubscribe', collectionName);
      return true;
    } else {
      return false;
    }
  }

  async getSubscription() {
    console.log(this.subObj);
    try {
      return Object.keys(this.subObj);
    } catch (e) {
      return e;
    }
  }

  //overall event를 저장하는 데 사용을 하였다.
  async eventSave(event) {
    const payload = event.payload;
    const eventType = event.event_type;
    const payment = payload.payment_token;

    let sender: string;
    let taker: string;
    let orderHash: string;
    let note = '';
    let currecy = '';
    let value = '';

    note = JSON.stringify(event);

    if (eventType === `item_sold`) {
      value = (Number(payload.sale_price) / 10 ** Number(payment.decimals)).toString();
      currecy = payment.name;
    } else if (eventType === `item_listed`) {
      value = (Number(payload.base_price) / 10 ** Number(payment.decimals)).toString();
      currecy = payment.name;
    }

    if (eventType === `item_transferred`) {
      sender = payload.from_account == null ? undefined : payload.from_account.address;
      taker = payload.to_account == null ? undefined : payload.to_account.address;
      orderHash = undefined;
    } else {
      sender = payload.maker == null ? undefined : payload.maker.address;
      taker = payload.taker == null ? undefined : payload.taker.address;
      orderHash = payload.order_hash;
    }

    await this.opensea.save({
      eventType: eventType,
      collection: payload.collection.slug,
      eventTime: payload.event_timestamp,
      link: payload.item.permalink,
      orderHash: orderHash,
      maker: sender,
      taker: taker,
      currency: currecy,
      value: value,
      note: note,
    });
  }

  //overall 데이터가 저장된 opensea table에서 tokenId 별로 list를 정리하는 function
  async parseData() {
    const collectionsRaw = await this.opensea.createQueryBuilder('opensea').select('opensea.collection').where(`event_type like '%list%'`).groupBy('opensea.collection').getMany();

    const collections = collectionsRaw.reduce((prev, now) => {
      prev[now.collection] = {};

      return prev;
    }, {});

    const data = await this.opensea.createQueryBuilder('opensea').where(`event_type like '%list%'`).getMany();

    data.forEach((d) => {
      const tokenId = d.link.split('/').pop();

      collections[d.collection][tokenId] = [];

      collections[d.collection][tokenId].push({ currency: d.currency, value: d.value });
    });

    return collections;
  }

  async setExpirationCollection(event) {
    let floorPrice: number;
    try {
      floorPrice = await this.getFloorPriceFromOpenseaApi(event.collectionName);
    } catch (e) {
      console.error('');
    }

    console.log(`만료로 인한 최저가 교체  collectionName: ${event.collectionName}   값: ${floorPrice}`);

    try {
      await this.dbUtils.updateCollectionFloorPriceWithOpenseaApi(event.collectionName, floorPrice);
    } catch (e) {
      console.error('');
    }
  }

  //event를 필수 요소로 나눠준다.
  parsedEventToElement(event: OpenseaEventType): EventInfoType {
    if (!event.payload.payment_token) {
      return undefined;
    }
    const defaultPrice = event.payload.base_price ?? event.payload.sale_price;

    const decimals = 10 ** event.payload.payment_token.decimals;
    const price = Number(defaultPrice) / decimals;
    const usdPrice = Number(event.payload.payment_token.usd_price);
    const ethPrice = Number(event.payload.payment_token.eth_price);
    const currencyName = event.payload.payment_token.name;
    const currencyToken = event.payload.payment_token.symbol;
    const collectionName = event.payload.collection.slug;

    const nftId = event.payload.item.nft_id ?? 'a/b/c';

    const nftInfo = nftId.split('/');

    const expirationDate = event.payload.expiration_date ? dayjs(event.payload.expiration_date).format('YYYY-MM-DD HH:mm:ss') : undefined;

    const chainInfo = nftInfo[0];
    const contractAddress = nftInfo[1];
    const tokenId = nftInfo[2];

    //잠깐 solana 배제
    if (chainInfo === 'solana') return undefined;

    return {
      price: price,
      usdPrice: usdPrice,
      ethPrice: ethPrice,
      currencyName: currencyName,
      currencyToken: currencyToken,
      decimals: decimals,
      chainInfo: chainInfo,
      contractAddress: contractAddress,
      collectionName: collectionName,
      tokenId: tokenId,
      expirationDate: expirationDate,
    };
  }

  async getFloorPriceFromOpenseaApi(collectionName: string): Promise<number> {
    //api를 호출한다.
    const response = await axios.get(`https://api.opensea.io/api/v1/collection/${collectionName}/stats`, {
      headers: {
        'x-api-key': this.configService.get('OPENSEA_API_KEY'),
      },
    });

    return Number(response.data.stats.floor_price);
  }

  async listedFloorPrice(event: OpenseaEventType) {
    console.log(`이벤트 발생 : ${event.event_type}  collection 이름 : ${event.payload.collection.slug}`);
    const eventInfo = this.parsedEventToElement(event);
    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');

    if (!eventInfo) {
      console.error(`이벤트 input 에러 : ` + event.event_type);
      return;
    }

    //collection정보를 불러온다.
    let collectionInfo: Collection;
    try {
      collectionInfo = await this.collection.createQueryBuilder('collection').where(`address= :address`, { address: eventInfo.contractAddress }).getOne();
    } catch (e) {
      throw `Error Occur get Collection ` + e;
    }

    if (collectionInfo === null) {
      try {
        const floorPrice = await this.getFloorPriceFromOpenseaApi(eventInfo.collectionName);
        await this.dbUtils.createCollectionRow(eventInfo, floorPrice);
        collectionInfo = await this.collection.createQueryBuilder('collection').where(`address=:address`, { address: eventInfo.contractAddress }).getOne();
        await this.dbUtils.logFloorPrice(collectionInfo.id, floorPrice, eventInfo.ethPrice, timestamp);
      } catch (e) {
        throw `Error Occur save new collection` + e;
      }
    }

    let currencyInfo: Currency;
    try {
      currencyInfo = await this.currency.createQueryBuilder('currency').where(`name=:name`, { name: eventInfo.currencyName }).getOne();
    } catch (e) {
      throw `Error Occur during currency db`;
    }

    if (currencyInfo === null) {
      await this.dbUtils.createCurrencyRow(eventInfo);
    }

    //이더로 통화를 통일
    const totalValue = eventInfo.price * eventInfo.ethPrice;

    try {
      //colection의 floor price 계산해서 낮으면 변경해준다.
      if (totalValue < collectionInfo.floorPrice) {
        console.log(`Floor Price가 변경이 되었어요~   ${totalValue}    ${collectionInfo.floorPrice}`);
        await this.dbUtils.updateCurrencyByCurrenyName(eventInfo);
        await this.dbUtils.updateCollectionFloorPriceWithStream(eventInfo, totalValue, collectionInfo.name);
        await this.dbUtils.logFloorPrice(collectionInfo.id, totalValue, eventInfo.ethPrice, timestamp);
      }
    } catch (e) {
      console.error(`Failed to update floor price in listing` + e);
    }
    return;
  }

  //판매나 취소 event시 사용하는 함수
  async soldAndCancelledPrice(event: OpenseaEventType) {
    const eventInfo = this.parsedEventToElement(event);
    //테스트 용으로 log를 내려놓음

    if (!eventInfo) {
      console.error(`이벤트 input 에러 : ` + event.event_type);
      return;
    }

    console.log(`이벤트 발생 : ${event.event_type}  collection 이름 : ${event.payload.collection.slug} floorPrice: ${eventInfo.price}`);

    let collectionInfo: Collection;

    try {
      collectionInfo = await this.collection.createQueryBuilder('collection').where(`address= :address`, { address: eventInfo.contractAddress }).getOne();
    } catch (e) {
      console.error(e);
    }

    if (collectionInfo === null) {
      console.log(`존재 하지 않는 collection 입니다.`);
      return;
    }

    //들어온 값을 ether로 통일시켜준다.
    const totalValue = eventInfo.price * eventInfo.ethPrice;

    // 현재 floor price보다 상당히 큰 값이 들어오면 아무일도 처리 하지 않는다.
    if (totalValue > collectionInfo.floorPrice + collectionInfo.floorPrice * 0.2) {
      console.log(`판매나 취소되었으나 floorPrice에 변동 없음 : ${totalValue}  ${collectionInfo.floorPrice}`);
      return;
    }

    let floorPrice: number;
    try {
      floorPrice = await this.getFloorPriceFromOpenseaApi(eventInfo.collectionName);
    } catch (e) {
      console.error(e);
    }

    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');

    //변경
    try {
      await this.dbUtils.updateCurrencyByCurrenyName(eventInfo);
      await this.dbUtils.updateCollectionFloorPriceWithOpenseaApi(eventInfo.collectionName, floorPrice);
      await this.dbUtils.logFloorPrice(collectionInfo.id, floorPrice, eventInfo.ethPrice, timestamp);
    } catch (e) {
      console.error(`update floor price error in sold and cancel` + e);
    }
  }

  async transferNft(event) {
    console.log(`이벤트 발생 : ${event.event_type}  collection 이름 : ${event.payload.collection.slug}`);
    const nftItem = event.payload.item.nft_id ?? 'a/b/c';

    const nftInfo = nftItem.split('/');

    const contractAddress = nftInfo[1];
    const tokenId = nftInfo[2];
    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');

    const collectionInfo = await this.collection.createQueryBuilder('collection').where(`address= :address`, { address: contractAddress }).getOne();

    if (collectionInfo === null) {
      console.log(`존재 하지 않는 collection 입니다.`);
      return;
    }

    let floorPrice: number;
    try {
      floorPrice = await this.getFloorPriceFromOpenseaApi(collectionInfo.name);
    } catch (e) {
      console.error(e);
    }

    //변경
    try {
      await this.dbUtils.updateCollectionFloorPriceWithOpenseaApi(collectionInfo.name, floorPrice);
      await this.dbUtils.logFloorPrice(collectionInfo.id, floorPrice, -1, timestamp);
    } catch (e) {
      console.error(e);
    }
  }

  //event에서 floor price를 분류한다.
  async checkFloorPrice(event) {
    // 점검이 필요한 시간인지 확인 한다.
    // if (dayjs(this.expirationFindQueryData).isAfter(dayjs())) {
    if (true) {
      this.expirationFindQueryData = dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm:ss');

      // 기한이 넘아간 것들을 갖고 온다.
      const overExpirationCollections = await this.dbUtils.findOverExpiration();

      // 이들의 floor price를 동기화 해주기 위해서 queue에 넣는다.
      overExpirationCollections.map((data) => {
        this.pushQueue({
          event_type: `collectionRefresh`,
          collectionName: data.name,
        });
      });
    }

    switch (event.event_type) {
      case 'item_listed':
        await this.listedFloorPrice(event);
        break;

      case 'item_sold':
      case 'item_cancelled':
        await this.soldAndCancelledPrice(event);
        break;

      case 'item_transferred':
        await this.transferNft(event);
        break;

      default:
        console.log(`Unknown Event Occur`);
        return 'Unknown Event Occur';
    }
  }

  // floor price를 전달해준다.
  async getFloorPrice() {
    let priceObj: Record<string, string | number>[];
    let currencyObj: Record<string, string>[];

    try {
      priceObj = await this.collection.createQueryBuilder('collection').select('name, floor_price, currency').getRawMany();
    } catch (e) {
      console.error(e);
    }

    try {
      const currencyData = await this.currency.createQueryBuilder('currency').select('symbol, eth_price').getRawMany();

      currencyObj = currencyData.reduce((prev, curr) => {
        prev[curr.symbol] = curr.eth_price;
        return prev;
      }, {});
    } catch (e) {
      console.error(e);
    }

    const rst = priceObj.map((data) => {
      data['floor_price'] = (data['floor_price'] as number) / Number(currencyObj[data.currency]);
      return data;
    }, {});

    return rst;
  }

  //collection의 floor Price의 기록들을 갖고 온다.
  async getCollectionFloorPriceLogs(collectionName: string) {
    try {
      return this.dbUtils.findFloorPriceLogsByCollection(collectionName);
    } catch (e) {
      console.error(e);
    }
  }
}
