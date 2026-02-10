import { Body, Controller, Get, Logger, Post, Redirect, Res } from '@nestjs/common';
import { RealtimeService } from './realtime.service';
import { Response } from 'express';
import { join } from 'path';
import { SyncService } from './services/sync/sync.service';
import { TcpService } from './tcp/tcp.service';
import { IsArray, IsNumber, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FeedStartService } from './services/feed-start/feed-start.service';
import { CliService } from './services/cli/cli.service';
import { FuzzySearchService } from './transfer/fuzzy-search/fuzzy-search.service';


class sendfeed {

  @ApiProperty({ example: 22, description: 'Case ID', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber()
  nLength: number;


  @ApiProperty({ example: 20, description: '', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber()
  nDelay: number;


  @ApiProperty({ example: 'cmd.json', description: 'Case ID', required: true })
  @IsString()
  cCmd: string;
}


class startfeed {

  @ApiProperty({ example: '20241118 Mar v Off.law', description: 'Files from assets', required: true })
  @IsString()
  file: number;


  @ApiProperty({ example: 20, description: '', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber()
  nDelay: number;

  @ApiProperty({ example: 40, description: '', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber()
  batch: number;
}



export class FuzzySearchDto {
  @ApiProperty({
    example: [
      "particular field. You got to find out different",
      "elements from analogy from different fields all around",
    ],
    description: 'Array of transcript lines',
    required: true,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true }) // Ensures each element in the array is a string
  lines: string[];

  // @ApiProperty({
  //   example: 'we have to control our',
  //   description: 'Search query string',
  //   required: true,
  // })
  // @IsString()
  // query: string;

  @ApiProperty({
    example: [
      "You got to find ",
      " out different",
    ],
    description: 'Array of transcript terms to search for',
    required: true,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true }) // Ensures each element in the array is a string
  query: string[];
}


@Controller()
export class RealtimeController {
  private readonly logger = new Logger(RealtimeController.name);
  constructor(private readonly realtimeService: RealtimeService,
    private syncService: SyncService, private tcp: TcpService,
    private feedStart: FeedStartService, private cli: CliService,
    private readonly search: FuzzySearchService) { }
  // @Get('*')
  // findAll(@Res() res: Response) {
  //   res.sendFile(join(__dirname, '..','..','..', 'public', 'index.html'));
  // }

  @Get()
  @Redirect('/index.html', 302) // Redirects to the static HTML file
  getHello(): string {
    return this.realtimeService.getHello();
  }

  @Post('syncdata')
  async syncdata(@Body() body: any): Promise<any> {
    await this.syncService.pushData();
  }


  @Post('sendfeed')
  async sendfeed(@Body() body: sendfeed): Promise<any> {
    return await this.tcp.readJsonAndSendData(body);
  }


  @Post('startfeed')
  async startfeed(@Body() body: startfeed): Promise<any> {
    return await this.feedStart.startFeed(body);
  }





  @Post('fetchdata')
  async fetchData(@Body() body: any): Promise<any> {
    return await this.cli.getData(body);
  }




  @Post('search')
  async testfuzzy(@Body() body: any): Promise<any> {
    // return await this.search.findFuzzySearch(body.lines, body.query);
    let res;
    try {
      // res = await this.search.textSearchPython(body.lines, body.query);
      res = await this.search.generateNewCordinates(body);
    } catch (error) {
      this.logger.error('Error at search', error?.message);
      res = []
    }
    return res
  }
  // // Alternatively, using the response object directly:
  // @Get('/direct')
  // directHtml(@Res() res: Response) {
  //   return res.redirect('/index.html');
  // }
}
