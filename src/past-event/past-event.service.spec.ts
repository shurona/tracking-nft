import { Test, TestingModule } from '@nestjs/testing';
import { PastEventService } from './past-event.service';

describe('PastEventService', () => {
  let service: PastEventService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PastEventService],
    }).compile();

    service = module.get<PastEventService>(PastEventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
