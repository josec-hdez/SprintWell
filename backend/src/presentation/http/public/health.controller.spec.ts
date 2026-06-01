import { Test, type TestingModule } from '@nestjs/testing';
import { GetSystemHealthUseCase } from '../../../application/shared/get-system-health.use-case.js';
import { SystemHealth } from '../../../domain/shared/system-health.js';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  let controller: HealthController;
  const execute = jest.fn();

  beforeEach(async () => {
    execute.mockReset();
    execute.mockResolvedValue(SystemHealth.ok());

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: GetSystemHealthUseCase,
          useValue: { execute },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('delegates to GetSystemHealthUseCase and returns its status', async () => {
    await expect(controller.check()).resolves.toEqual({ status: 'ok' });
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
