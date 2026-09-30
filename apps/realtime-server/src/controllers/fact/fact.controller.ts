import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Post,
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { FactService } from '../../services/fact/fact.service';
import type { RealtimeRequest } from '../../middleware/realtime-auth.middleware';
// import { FactFgaService } from '../../services/fact-fga/fact-fga.service';
import {
  FactDetailReq,
  factDetailSingle,
  InsertFact,
  InsertQuickFact,
  quickfactUpdate,
  UpdatePermissionsRequestBody,
} from '../../interfaces/fact.interface';
import {
  deleteHighlightsRequestBody,
  InsertHighlightsRequestBody,
} from '../../interfaces/issue.interface';

@ApiTags('fact')
@Controller('fact')
export class FactController {
  constructor(
    private factservice: FactService,
    // private factFgaService: FactFgaService,
  ) {}
  @Get('detail')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getFactDetail(@Query() query: FactDetailReq): Promise<any> {
    return this.factservice.getFactDetailById(query);
  }

  @Post('quickfactupdate')
  @UsePipes(new ValidationPipe({ transform: true }))
  async quickfactupdate(@Body() body: quickfactUpdate): Promise<any> {
    return this.factservice.quickfactUpdate(body);
  }

  @Get('factcontact')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getFactContact(@Query() query: factDetailSingle): Promise<any> {
    return this.factservice.getFactcontact(query);
  }
  @Get('factshared')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getFactshared(@Query() query: factDetailSingle): Promise<any> {
    return this.factservice.getFactshared(query);
  }

  @Post('insertquickfact')
  @UsePipes(new ValidationPipe({ transform: true }))
  async insertQuickfact(@Body() body: InsertQuickFact, @Req() req: RealtimeRequest): Promise<any> {
    try {
      const res = await this.factservice.insertQuickFact(body, req.user);
      if (res && res.nFSid) {
        body['nFSid'] = res.nFSid;
        await this.factservice.insertFactDetail(body);
        await this.factservice.insertFactissues(body);
        await this.factservice.insertFactcontact(body);
        await this.factservice.insertFactteam(body);
        await this.factservice.markAsTranscriptIfPublished(body.nSesid, res.nFSid);
        return {
          msg: 1,
          value: 'Quick fact inserted successfully',
          nFSid: res['nFSid'],
          color: res['color'],
        };
      } else {
        return {
          msg: -1,
          value: 'Quick fact not inserted successfully',
          error: res.error,
        };
      }
    } catch (error) {
      // The create gate's 403 / 500 must reach the client, not become a 200.
      if (error instanceof HttpException) throw error;
      return {
        msg: -1,
        value: 'Quick fact not inserted successfully',
        error: error,
      };
    }
  }

  @Post('insertfact')
  @UsePipes(new ValidationPipe({ transform: true }))
  async insertfact(@Body() body: InsertFact, @Req() req: RealtimeRequest): Promise<any> {
    try {
      const res = await this.factservice.insertFact(body, req.user);
      if (res && res.nFSid) {
        body['nFSid'] = res.nFSid;
        await this.factservice.insertFactDetail(body);
        await this.factservice.saveReviewStatus(res.nFSid, body.nRv);
        await this.factservice.insertFactlink(body);
        await this.factservice.insertFactissues(body);
        await this.factservice.insertFactcontact(body);
        await this.factservice.insertFacttask(body);
        await this.factservice.insertFactteam(body);
        await this.factservice.markAsTranscriptIfPublished(body.nSesid, res.nFSid);
        return {
          msg: 1,
          value: 'Fact inserted successfully',
          nFSid: res['nFSid'],
          color: res['color'],
        };
      } else {
        return {
          msg: -1,
          value: 'Fact not inserted successfully',
          error: res.error,
        };
      }
    } catch (error) {
      // The create gate's 403 / 500 must reach the client, not become a 200.
      if (error instanceof HttpException) throw error;
      return { msg: -1, value: 'Fact not inserted successfully', error: error };
    }
  }

  @Get('facttask')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getFacttask(@Query() query: factDetailSingle): Promise<any> {
    try {
      const res = await this.factservice.getFacttask(query);
      return res;
    } catch (error) {
      // The view gate's 403 / 404 / 500 must reach the client, not become a 200.
      if (error instanceof HttpException) throw error;
      return { msg: -1, value: error.message, error: error };
    }
  }

  @Post('insertHighlights')
  async insertHighlights(
    @Body() body: InsertHighlightsRequestBody,
    @Req() req: RealtimeRequest,
  ): Promise<any> {
    // The quick mark gate's 403 / 500 propagates (no try/catch here).
    return this.factservice.insertHighlights(body, 'I', req.user);
  }

  @Post('deleteHighlights')
  async deleteHighlights(
    @Body() body: deleteHighlightsRequestBody,
    @Req() req: Request,
  ): Promise<any> {
    return this.factservice.deleteHighlights(body, 'D', !!req['isAdmin']);
  }

  // @Post('update/permissions')
  // async updatePermissions(
  //   @Body() body: UpdatePermissionsRequestBody,
  // ): Promise<any> {
  //   return this.factservice.updatePermissions(body);
  // }

  // @Get('permissions/:nFactid')
  // async getPermissions(
  //   @Param('nFactid') nFactid: string,
  //   @Query('userIds') userIds: string,
  // ): Promise<any> {
  //   const users = userIds.split(',').map((id) => ({ nUserid: id }));
  //   const perms = await this.factservice.getPermissions(nFactid, users);
  //   return { msg: 1, value: perms };
  // }

  // @Get('permissions-json/:userId')
  // @UsePipes(new ValidationPipe({ transform: true }))
  // async getFactPermissionsJson(
  //   @Param('userId') userId: string,
  //   @Query('consistency') consistency?: 'fully-consistent' | 'best-effort',
  // ): Promise<any> {
  //   try {
  //     const permissions = await this.factFgaService.getFactPermissionsJson(
  //       userId,
  //       consistency || 'fully-consistent',
  //     );
  //     return {
  //       msg: 1,
  //       value: permissions,
  //     };
  //   } catch (error) {
  //     return {
  //       msg: -1,
  //       value: 'Failed to get fact permissions',
  //       error: error.message,
  //     };
  //   }
  // }

  // @Get('users-permissions/:factId')
  // @UsePipes(new ValidationPipe({ transform: true }))
  // async getFactUserPermissions(
  //   @Param('factId') factId: string,
  // ): Promise<any> {
  //   try {
  //     const userPermissions = await this.factFgaService.getFactUserPermissions(factId);
  //     return {
  //       msg: 1,
  //       value: userPermissions,
  //     };
  //   } catch (error) {
  //     return {
  //       msg: -1,
  //       value: 'Failed to get fact user permissions',
  //       error: error.message,
  //     };
  //   }
  // }
  
}
