import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BundleCreationService } from '../../services/bundle/bundle-creation.service';
import { BundleBuildReq, BundleBuildRes, DeleteBundlesReq, DeleteBundlesRes, FileRenameReq, FileRenameRes, PasteBundlesReq, PasteBundlesRes, PermissionReq, PermissionRes, SectionBuildReq, SectionBuildRes, UndoBundlesReq, updateBundleDetailReq, updateBundleDetailRes, updateBundleReq, updateBundleRes, updateTabReq, UserSectionBuildReq } from '../../interfaces/bundle.management';
import { deleteRecentReq, deleteRecentRes, insertRecentReq, insertRecentRes, shareSectionbundleReq } from '../../interfaces/bundle.interface';
import { LogInterceptor } from '@app/global/interceptor/log.interceptor';
import { ApiId } from '@app/global/decorator/apiid';
import { RedisCacheService } from '../../services/redis-cache/redis-cache/redis-cache.service';

@ApiBearerAuth('JWT')
@ApiTags('bundles-creations')
@Controller('bundles-creations')
export class BundleCreationController {

    constructor(private readonly bundleService: BundleCreationService,
        private readonly RCService: RedisCacheService
    ) {
    }


    @Post('sectionbuilder')
    async sectionBuilder(@Body() body: SectionBuildReq): Promise<SectionBuildRes> {
        return await this.bundleService.sectionBuilder(body);
    }


    @Post('bundlebuilder')
    async bundleBuilder(@Body() body: BundleBuildReq): Promise<BundleBuildRes> {
        const res = await this.bundleService.bundleBuilder(body);
        this.RCService.updateCache(body, ['bundledetail']);
        return res;
    }

    @Post('renamefile')
    async renameFile(@Body() body: FileRenameReq): Promise<FileRenameRes> {
        const res = await this.bundleService.fileRename(body);
        this.RCService.updateCache(body, ['bundledetail']);
        return res;
    }


    @Post('setpermission')
    @UseInterceptors(LogInterceptor)
    @ApiId(18)
    async setPermission(@Body() body: PermissionReq): Promise<PermissionRes> {
        const res = await this.bundleService.setPermission(body);
        this.RCService.updateCache(body, ['bundledetail']);
        return res;
    }


    @Post('deletebundles')
    async deleteBundles(@Body() body: DeleteBundlesReq): Promise<DeleteBundlesRes> {
        const res = await this.bundleService.deleteBundles(body);
        this.RCService.updateCache(body, ['bundledetail']);
        return res;
    }


    @Post('copybundles')
    @UseInterceptors(LogInterceptor)
    @ApiId(31)
    async copyBundles(@Body() body: PasteBundlesReq): Promise<PasteBundlesRes> {
        const res = await this.bundleService.copyBundles(body);
        this.RCService.updateCache(body, ['bundledetail']);
        return res;
    }


    @Post('cutbundles')
    @UseInterceptors(LogInterceptor)
    @ApiId(32)
    async cutBundles(@Body() body: PasteBundlesReq): Promise<PasteBundlesRes> {
        const res = await this.bundleService.cutBundles(body);
        this.RCService.updateCache(body, ['bundledetail']);
        return res;
    }


    @Post('undobundles')
    @UseInterceptors(LogInterceptor)
    @ApiId(32)
    async undoBundles(@Body() body: UndoBundlesReq): Promise<PasteBundlesRes> {
        const res = await this.bundleService.undoBundles(body);
        this.RCService.updateCache(body, ['bundledetail']);
        return res;
    }


    @Post('updatebundledetail')
    async updateBundleDetail(@Body() body: updateBundleDetailReq): Promise<updateBundleDetailRes> {
        const data = await this.bundleService.updateBundleDetail(body);
        this.RCService.updateCache(body, ['bundledetail']);
        return data;
    }


    @Post('updatetag')
    async updateBundleTag(@Body() body: updateBundleReq): Promise<updateBundleRes> {
        const res = this.bundleService.updateBundleTag(body);
        this.RCService.updateCache(body, ['bundledetail']);
        return res;
    }


    @Post('updatetab')
    async updateFileTab(@Body() body: updateTabReq): Promise<updateBundleRes> {
        const res = this.bundleService.updateFileTab(body);
        this.RCService.updateCache(body, ['bundledetail']);
        return res;
    }



    @Post('clearrecent')
    async clearRecent(@Body() body: deleteRecentReq): Promise<deleteRecentRes> {
        return await this.bundleService.clearRecent(body);
    }

    @Post('usersectionbuilder')
    async usersectionBuilder(@Body() body: UserSectionBuildReq): Promise<SectionBuildRes> {
        return await this.bundleService.userSectionBuilder(body);
    }

    @Post('sharesectionbundle')
    async share_sectionbundle(@Body() body: shareSectionbundleReq): Promise<any> {
        const res = await this.bundleService.share_sectionbundle(body);
        this.RCService.updateCache(body, ['bundledetail']);
        return res;
    }


    @Post('insert/recent')
    async insertRecent(@Body() body: insertRecentReq): Promise<insertRecentRes> {
        return await this.bundleService.insertRecent(body);
    }

}
