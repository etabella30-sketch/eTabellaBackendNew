import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SfuService } from './sfu.service';

@ApiTags('health')
@Controller()
export class SfuController {
  constructor(private readonly sfuService: SfuService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the health status of the SFU service',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok', description: 'Service status' },
        message: { type: 'string', example: 'SFU service is running', description: 'Status message' },
        timestamp: { type: 'string', example: '2025-04-19T06:00:00.000Z', description: 'Current timestamp' },
        version: { type: 'string', example: '1.0.0', description: 'Service version' },
        workers: { type: 'number', example: 4, description: 'Number of active mediasoup workers' }
      }
    }
  })
  getHealth(): object {
    const stats = this.sfuService.getStats();
    return {
      status: 'ok',
      message: 'SFU service is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }
}
