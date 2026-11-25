import { Test } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { NotificationController } from './notification.controller';
import { NotificationService } from '../../services/notification/notification.service';

describe('NotificationController', () => {
  const notifications = { emit: jest.fn() };
  let controller: NotificationController;

  beforeEach(async () => {
    notifications.emit.mockReset().mockResolvedValue('sent');
    const module = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [{ provide: NotificationService, useValue: notifications }],
    }).compile();
    controller = module.get(NotificationController);
  });

  it('preserves an existing event key when forwarding the notification', async () => {
    const event = { cEventKey: 'event-1', cType: 'FS' };
    await expect(controller.handeAuth2(event, {} as KafkaContext)).resolves.toBe('sent');
    expect(notifications.emit).toHaveBeenCalledWith(event);
  });

  it('derives a stable key from the Kafka record when a producer key is missing', async () => {
    const context = { getTopic: () => 'notification', getPartition: () => 2, getMessage: () => ({ offset: '45' }) } as KafkaContext;
    await controller.handeAuth2({ cType: 'FS' }, context);
    expect(notifications.emit).toHaveBeenCalledWith({ cType: 'FS', cEventKey: 'legacy-kafka:notification:2:45' });
  });
});
