import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createAlchemyWeb3 } from '@alch/alchemy-web3';

import dayjs from 'dayjs';
import axios from 'axios';
import { EventData } from 'web3-eth-contract';
import { Repository } from 'typeorm';

import { ConfigService } from '@nestjs/config';

import { Contract, Token, EventList } from './entities';
import { ABI_721 } from '../abis';

@Injectable()
export class PastEventService {
  constructor(
    @InjectRepository(Contract)
    private contract: Repository<Contract>,

    @InjectRepository(Token)
    private token: Repository<Token>,

    @InjectRepository(EventList)
    private eventList: Repository<EventList>,

    private readonly configService: ConfigService,
  ) {}

  /**
   * @Params {string} contractAddress
   *
   * @returns result of past events
   */
  async findAll(contractAddress: string, tokenId: string, chainName: string) {
    console.log(`컨트랙 : ${contractAddress} 토큰 아이디: ${tokenId}  체인 이름 :${chainName}`);

    const tp = await this.getPastEvent(contractAddress, tokenId, chainName);

    return tp;

    const checkContract = await this.contract.createQueryBuilder('Contract').where(`address='${contractAddress}'`).getOne();

    console.log(checkContract);
    let asdf;
    //입력을 받은 contract가 존재하면 값을 바로 return해 준다.
    //만약 존재하지 않으면 과거의 event를 검색 해서 저장을 한 후 그 값을 return 해준다.
    if (!checkContract) {
      asdf = await this.getPastEvent(contractAddress, tokenId, chainName);
    }

    return await this.contract
      .createQueryBuilder('Contract')
      .leftJoinAndSelect('Contract.tokens', 'token')
      .leftJoinAndSelect('token.events', 'event')
      .where(`Contract.address='${contractAddress}'`)
      .getMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} pastEvent`;
  }

  remove(id: number) {
    return `This action removes a #${id} pastEvent`;
  }

  getHost(chainName: string) {
    let host: string;
    switch (chainName) {
      case 'eth':
        host = `https://eth-mainnet.alchemyapi.io/v2/`;
        break;

      case 'polygon':
        host = 'https://polygon-mainnet.g.alchemy.com/v2/';
        break;

      default:
      //
    }
    return host;
  }

  async nftInfoFromOpensea() {
    //opensea api 호출
    const option = {
      //
    };

    const response = await axios.get('', option);
  }

  /**
   * @descripition 컨트랙트의 정보를 갖고 온다.
   * @param contractAddress contract주소
   * @param tokenId 토큰 id
   * @param chainName 체인 이름
   * @returns
   */
  async getContract(contractAddress: string, tokenId: string, chainName: string) {
    const apiKey = this.configService.get(`ALCHEMY_API_KEY`);
    const mainNetHost = this.getHost(chainName);

    const web3 = createAlchemyWeb3(`${mainNetHost}${apiKey}`);

    const contract = new web3.eth.Contract(ABI_721, contractAddress);

    return contract;
  }

  /**
   * @description web3를 이용하여서 erc165를 이용한 확인
   * @param contractAddress contract주소
   * @param tokenId 토큰 id
   * @param chainName 체인 이름
   * @returns 결과값
   */
  async check721(contractAddress: string, tokenId: string, chainName: string) {
    // console.log(`컨트랙 : ${contractAddress} 토큰 아이디: ${tokenId}  체인 이름 :${chainName}`);

    const contract = await this.getContract(contractAddress, tokenId, chainName);

    let check;

    try {
      check = await contract.methods.supportsInterface('0x80ac58cd').call();
    } catch (e) {
      return e;
    }

    return check;
  }

  //web3를 이용하여서 과거의 event를 갖고 옴
  async getPastEvent(contractAddress: string, tokenId: string, chainName: string) {
    const contract = await this.getContract(contractAddress, tokenId, chainName);

    let rst: EventData[];

    try {
      rst = await contract.getPastEvents('Transfer', {
        filter: { tokenId: tokenId },
        fromBlock: 0,
        toBlock: 'latest',
      });
    } catch (e) {
      throw e;
    }

    rst.map((data) => {
      console.log(data);
    });

    return rst;

    //contract 우선 저장
    const contractInfo = await this.contract.save({
      name: 'name',
      description: 'description',
      address: contractAddress,
    });

    // tokenId 저장
    const tokenInfo = await this.token.save({
      contractId: contractInfo.id,
      recentlySearchTime: dayjs().format('YYYY-MM-DD HH:mm'),
      blockNumber: 1000,
    });

    //찾은 event들을 모두 저장한다.
    await rst.reduce(async (prev, curr) => {
      const promise = await prev;

      // event 저장
      await this.eventList.save({
        tokenId: tokenInfo.id,
        method: 'Transfer',
        occurTime: 'a!lu',
      });

      return promise;
    }, Promise.resolve(''));

    console.log('저장완료');
  }
}
