import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FactService } from '../../services/fact/fact.service';
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
  async insertQuickfact(@Body() body: InsertQuickFact): Promise<any> {
    try {
      const res = await this.factservice.insertQuickFact(body);
      if (res && res.nFSid) {
        body['nFSid'] = res.nFSid;
        await this.factservice.insertFactDetail(body);
        await this.factservice.insertFactissues(body);
        await this.factservice.insertFactcontact(body);
        await this.factservice.insertFactteam(body);
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
      return {
        msg: -1,
        value: 'Quick fact not inserted successfully',
        error: error,
      };
    }
  }

  @Post('insertfact')
  @UsePipes(new ValidationPipe({ transform: true }))
  async insertfact(@Body() body: InsertFact): Promise<any> {
    try {
      const res = await this.factservice.insertFact(body);
      if (res && res.nFSid) {
        body['nFSid'] = res.nFSid;
        await this.factservice.insertFactDetail(body);
        await this.factservice.insertFactlink(body);
        await this.factservice.insertFactissues(body);
        await this.factservice.insertFactcontact(body);
        await this.factservice.insertFacttask(body);
        await this.factservice.insertFactteam(body);
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
      return { msg: -1, value: error.message, error: error };
    }
  }

  @Post('insertHighlights')
  async insertHighlights(
    @Body() body: InsertHighlightsRequestBody,
  ): Promise<any> {
    return this.factservice.insertHighlights(body, 'I');
  }

  @Post('deleteHighlights')
  async deleteHighlights(
    @Body() body: deleteHighlightsRequestBody,
  ): Promise<any> {
    return this.factservice.deleteHighlights(body, 'D');
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
