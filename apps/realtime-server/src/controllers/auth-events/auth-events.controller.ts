import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EventsGateway } from '../../events/events.gateway';

/**
 * Sign-in (LOGIN-VERIFY) or sign-out (SESSION-ENDED) on one browser, from authapi: tell the user's realtime
 * sockets, then close the ones on every other browser, so the live feed stops server-side even for a client that
 * ignores the event. The socket bound to the event's browser stays open.
 */
@Controller()
export class AuthEventsController {
  constructor(private readonly gateway: EventsGateway) { }

  @MessagePattern('LOGIN-VERIFY')
  onSignIn(@Payload() message: any) {
    return this.gateway.endOtherDevices(message?.data?.nMasterid, message?.data?.cBroweserid, 'LOGIN-VERIFY');
  }

  @MessagePattern('SESSION-ENDED')
  onSignOut(@Payload() message: any) {
    return this.gateway.endOtherDevices(message?.data?.nMasterid, message?.data?.cBroweserid, 'SESSION-ENDED');
  }
}
