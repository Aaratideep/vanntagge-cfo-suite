import { Test, TestingModule } from '@nestjs/testing';
import { EngagementsController } from './engagements.controller';

describe('EngagementsController', () => {
  let controller: EngagementsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EngagementsController],
    }).compile();

    controller = module.get<EngagementsController>(EngagementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
