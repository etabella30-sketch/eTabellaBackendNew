import { Body, Controller, Delete, Get, Inject, Post, Query, Req, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Caller, callerOf, isDomainError } from '@app/api-kernel';
import { BundleDetailFields, BundlesFields, DOCUMENTS_OPS, DocumentsOperations } from '@app/rt-features/documents';
import { BundleCreationService } from '../../services/bundle/bundle-creation.service';
import { BundleDetailReq, BundleDetailRes, BundleLinksReq, BundleLinksRes, BundleReq, BundleRes, BundleSearchReq, BundleSearchRes, BundleIndexReq, BundleUploadReq, BundlesPermissionReq, BundlesPermissionRes, BundletabReq, BundletabRes, BundletagReq, BundletagRes, FileLinkReq, SectionReq, SectionRes, TeamUsersReq, TeamUsersRes, bundleTypesReq, bundleTypesRes, checkIssuetagReq, displayReq, filedataReq, filedataRes, pagginationReq, pagginationRes, recentFileReq, recentFileRes, getbundleSharedReq, shareUserbundleReq, displayFilesReq, getFileids, getFiletypes, } from '../../interfaces/bundle.interface';
import { LogInterceptor } from '@app/global/interceptor/log.interceptor';
import { ApiId } from '@app/global/decorator/apiid';
import { linkexplorerReq } from '../../interfaces/individual.interface';
import { RedisCacheService } from '../../services/redis-cache/redis-cache/redis-cache.service';
import { downloadChangeSerialReq, downloadSFileReq, downloadSFileRes } from '../../interfaces/bundle.management';
import { SavedSearchDeleteReq, SavedSearchListReq, SavedSearchRes, SavedSearchSaveReq } from '../../interfaces/savedsearch.interface';


@ApiBearerAuth('JWT')
@ApiTags('bundles')
@Controller('bundles')
export class BundlesController {
    constructor(private readonly bundleService: BundleCreationService,
        private readonly RCService: RedisCacheService,
        @Inject(DOCUMENTS_OPS) private readonly documents: DocumentsOperations,
    ) {
    }

    /**
     * Phase 10c of the shared-libraries plan: the eight document reads of the RT page (sections, usersections, bundle,
     * bundledetail, bundledetail-search, folder-search, index, filedata) run in @app/rt-features/documents
     * (DocumentsService, shared with realtime-server, which serves them to the venue box). This surface keeps its DTOs,
     * Swagger and API-usage log, and answers a failure as it always did: the `{ msg: -1, value: 'Failed to fetch', error }` row.
     */
    private async shared<T>(req: Request, op: (caller: Caller) => Promise<unknown>): Promise<T> {
        const caller = callerOf(req);
        if (!caller) return { msg: -1, value: 'Failed to fetch', error: 'no signed-in user' } as unknown as T;
        try {
            return (await op(caller)) as T;
        } catch (error) {
            if (!isDomainError(error)) throw error;
            const said = (error.detail as { error?: unknown } | undefined)?.error;
            return { msg: -1, value: 'Failed to fetch', error: said === undefined ? error.message : said } as unknown as T;
        }
    }

    @Get('sections')
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseInterceptors(LogInterceptor)
    @ApiId(37)
    async getSections(@Query() query: SectionReq, @Req() req: Request): Promise<SectionRes> {
        return this.shared<SectionRes>(req, (caller) => this.documents.sections(caller, query));
    }

    // @Get('bundle')
    // @UsePipes(new ValidationPipe({ transform: true }))
    // @UseInterceptors(LogInterceptor)
    // @ApiId(17)
    // async getBundle(@Query() query: BundleReq): Promise<BundleRes> {
    //     return await this.bundleService.getBundle(query);
    // }


    @Post('bundle')
    async getBundle(@Body() body: BundleReq, @Req() req: Request): Promise<BundleRes> {
        // The host DTO types pageNumber as the Number wrapper; the shared fields as number (the same parseInt value).
        return this.shared<BundleRes>(req, (caller) => this.documents.bundles(caller, body as unknown as BundlesFields));
    }

    @Get('bundledetail')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getBundledetail(@Query() query: BundleDetailReq, @Req() req: Request): Promise<BundleDetailRes> {
        return this.shared<BundleDetailRes>(req, (caller) => this.documents.bundleDetail(caller, query as unknown as BundleDetailFields));
    }




    @Get('searched-bundles')
    @UsePipes(new ValidationPipe({ transform: true }))
    async searchBundles(@Query() query: bundleTypesReq): Promise<BundleRes> {
        return await this.bundleService.getSearchedBundles(query);
    }


    @Get('folder-search')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFolderSearch(@Query() query: BundleSearchReq, @Req() req: Request): Promise<BundleSearchRes[]> {
        return this.shared<BundleSearchRes[]>(req, (caller) => this.documents.folderSearch(caller, query));
    }


    @Get('index')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getBundleIndex(@Query() query: BundleIndexReq, @Req() req: Request): Promise<any[]> {
        return this.shared<any[]>(req, (caller) => this.documents.bundleIndex(caller, query));
    }


    @Get('bundledetail-search')
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseInterceptors(LogInterceptor)
    @ApiId(38)
    async getBundledetailSearched(@Query() query: BundleDetailReq, @Req() req: Request): Promise<BundleDetailRes> {
        return this.shared<BundleDetailRes>(req, (caller) => this.documents.bundleDetailSearch(caller, query as unknown as BundleDetailFields));
    }

    @Get('saved-search')
    @UsePipes(new ValidationPipe({ transform: true }))
    async listSavedSearches(@Query() query: SavedSearchListReq): Promise<SavedSearchRes[]> {
        return await this.bundleService.listSavedSearches(query);
    }

    @Post('saved-search')
    async saveSearch(@Body() body: SavedSearchSaveReq): Promise<SavedSearchRes> {
        return await this.bundleService.saveSearch(body);
    }

    @Delete('saved-search')
    async deleteSavedSearch(@Body() body: SavedSearchDeleteReq): Promise<SavedSearchRes> {
        return await this.bundleService.deleteSavedSearch(body);
    }

    @Get('teamsusers')
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseInterceptors(LogInterceptor)
    @ApiId(47)
    async getTeamUsers(@Query() query: TeamUsersReq): Promise<TeamUsersRes> {
        return await this.bundleService.getTeamsUsers(query);
    }

    @Get('bundlepermissions')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getBunlesPermissions(@Query() query: BundlesPermissionReq): Promise<BundlesPermissionRes> {
        return await this.bundleService.getBunlesPermissions(query);
    }



    @Get('bundletypes')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getBundleTypes(@Query() query: bundleTypesReq): Promise<bundleTypesRes> {
        return await this.bundleService.getBundleTypes(query);
    }



    @Get('paginationdata')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getPaggination(@Query() query: pagginationReq): Promise<pagginationRes> {
        return await this.bundleService.getPaggination(query);
    }


    @Get('filedata')
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseInterceptors(LogInterceptor)
    @ApiId(21)
    async getFiledata(@Query() query: filedataReq, @Req() req: Request): Promise<filedataRes> {
        return this.shared<filedataRes>(req, (caller) => this.documents.fileData(caller, query));
    }


    @Get('recentFile')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getrecentFile(@Query() query: recentFileReq): Promise<recentFileRes> {
        return await this.bundleService.getRecentFile(query);
    }


    @Get('bundletag')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getBundletag(@Query() query: BundletagReq): Promise<BundletagRes> {
        return await this.bundleService.getBundletag(query);
    }

    @Get('bundletab')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getBundletab(@Query() query: BundletabReq): Promise<BundletabRes> {
        return await this.bundleService.getBundletab(query);
    }
    @Get('usersections')
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseInterceptors(LogInterceptor)
    @ApiId(37)
    async getUserSections(@Query() query: SectionReq, @Req() req: Request): Promise<SectionRes> {
        return this.shared<SectionRes>(req, (caller) => this.documents.userSections(caller, query));
    }

    @Get('uploadsections')
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseInterceptors(LogInterceptor)
    @ApiId(37)
    async getUploadSections(@Query() query: SectionReq): Promise<SectionRes> {
        return await this.bundleService.getUploadSections(query);
    }

    @Get('checkissuetag')
    @UsePipes(new ValidationPipe({ transform: true }))
    async checkissuetag(@Query() query: checkIssuetagReq): Promise<SectionRes> {
        return await this.bundleService.checkissuetag(query);
    }

    @Get('getdisplaycontact')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getdisplaycontact(@Query() query: displayReq): Promise<any> {
        return await this.bundleService.getdisplaycontact(query);
    }



    @Get('getdisplaytag')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getdisplaytag(@Query() query: displayReq): Promise<any> {
        return await this.bundleService.getdisplaytags(query);
    }


    @Get('getdisplayissue')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getdisplayissue(@Query() query: displayReq): Promise<any> {
        return await this.bundleService.getdisplayissue(query);
    }


    @Get('getdisplayfiles')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getdisplayfiles(@Query() query: displayFilesReq): Promise<any> {
        return await this.bundleService.getdisplayfiles(query);
    }

    @Get('bundle_links')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getBundlelinks(@Query() query: BundleLinksReq): Promise<BundleLinksRes> {
        return await this.bundleService.getBundleLinks(query);
    }




    @Get('file_links')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getfilelinks(@Query() query: FileLinkReq): Promise<any> {
        return await this.bundleService.getfilelinks(query);
    }


    @Get('getBundleparentids')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getBundleparentids(@Query() query: BundleUploadReq): Promise<any> {
        return await this.bundleService.getBundleparentIds(query);
    }

    @Get('locationshare/users')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getSharesUsers(@Query() query: linkexplorerReq): Promise<any[]> {
        return await this.bundleService.getSharesUsers(query);
    }


    @Get('getbundlesharedusers')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getBundleSharesUsers(@Query() query: getbundleSharedReq): Promise<any[]> {
        return await this.bundleService.getBundleSharesUsers(query);
    }

    @Get('getbundleshared')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getBundleShares(@Query() query: getbundleSharedReq): Promise<any[]> {
        return await this.bundleService.getBundleShares(query);
    }

    @Get('getoutgoingshared')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getOutgoingBundleShares(@Query() query: getbundleSharedReq): Promise<any[]> {
        return await this.bundleService.getOutgoingBundleShares(query);
    }


    @Get('getshareduserby_bundleid')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getSharesUsers_by_bundle(@Query() query: shareUserbundleReq): Promise<any[]> {
        return await this.bundleService.getSharesUsers_by_bundle(query);
    }

    @Get('get_fileids')
    @UsePipes(new ValidationPipe({ transform: true }))
    async get_fileids(@Query() query: getFileids): Promise<any[]> {
        return await this.bundleService.get_fileids(query);
    }

    @Get('get_filetypes')
    @UsePipes(new ValidationPipe({ transform: true }))
    async get_filetypes(@Query() query: getFiletypes): Promise<any[]> {
        return await this.bundleService.get_filetypes(query);
    }

    @Get('download_selected_files')
    @UsePipes(new ValidationPipe({ transform: true }))
    async downloadS_files(@Query() query: downloadSFileReq): Promise<downloadSFileRes[]> {
        return await this.bundleService.downloadS_files(query);
    }

    @Get('download_update_serial')
    @UsePipes(new ValidationPipe({ transform: true }))
    async downloadChangeSerial(@Query() query: downloadChangeSerialReq): Promise<any> {
        return await this.bundleService.downloadChangeSerial(query);
    }
}
