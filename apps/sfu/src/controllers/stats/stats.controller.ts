import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SfuService } from '../../sfu.service';

@ApiBearerAuth('JWT')
@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly sfuService: SfuService) {}

  @Get()
  @ApiOperation({ summary: 'Get SFU statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns current statistics about the SFU service', 
    schema: {
      type: 'object',
      properties: {
        workers: { type: 'number', description: 'Number of active mediasoup workers' },
        activeWorkerIndex: { type: 'number', description: 'Index of currently active worker' },
        transports: { type: 'number', description: 'Number of active WebRTC transports' },
        producers: { type: 'number', description: 'Number of active media producers' },
        consumers: { type: 'number', description: 'Number of active media consumers' }
      }
    }
  })
  getStats() {
    return this.sfuService.getStats();
  }
}
