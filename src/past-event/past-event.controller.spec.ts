import { Test, TestingModule } from '@nestjs/testing';
import { PastEventController } from './past-event.controller';
import { PastEventService } from './past-event.service';

describe('PastEventController', () => {
  let controller: PastEventController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PastEventController],
      providers: [PastEventService],
    }).compile();

    controller = module.get<PastEventController>(PastEventController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
