import { DbService } from '@app/global/db/pg/db.service';
import {
    BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, ServiceUnavailableException,
} from '@nestjs/common';
import { RtDemoDocumentReq, RtDemoDocumentRes } from '../../interfaces/rt-demo.interface';
import { RT_DEMO_FILE_SQL, RT_DEMO_MASTER_SECTION_SQL } from './rt-demo.query';
import { cleanDocumentField, findDocumentRowForReference, pageCountFromRange } from './rt-demo-reference';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Same candidate window the RT page asks for in a real session. */
const INDEX_WINDOW = 80;

/**
 * Document links clicked in the RT Simulation (the RT page's demo mode).
 *
 * They always open from the ONE case a super admin chose in Admin > Case Detail
 * (AppSetting.nRTSimCaseid, read via et_rt_sim_source_resolve). The caller never
 * names the case and is never given access to it: this reads the case's Master
 * section only, writes nothing (no RecentFiles, no team row), and returns just
 * enough to open the file. Any signed-in user may ask.
 */
@Injectable()
export class RtDemoService {
    private readonly logger = new Logger('RtDemo');

    constructor(private readonly db: DbService) { }

    async document(query: RtDemoDocumentReq): Promise<RtDemoDocumentRes> {
        if (!UUID.test(query.nMasterid || '')) throw new BadRequestException('Invalid user');
        const tab = cleanDocumentField(query.cTab).toUpperCase();

        const caseId = await this.sourceCaseId();
        if (!caseId) throw new ServiceUnavailableException('RT Simulation documents are not set up');

        const section = await this.db.rowQuery(RT_DEMO_MASTER_SECTION_SQL, [caseId]);
        if (!section.success) throw new InternalServerErrorException('Unable to open the document');
        const sectionId: string | undefined = section.data?.[0]?.nSectionid;
        if (!sectionId) {
            this.logger.error(`RT Simulation source case ${caseId} has no Master section`);
            throw new ServiceUnavailableException('RT Simulation documents are not set up');
        }

        // No nMasterid on purpose: the index then shows the section as any
        // non-member sees it, so the answer never depends on who clicked.
        const index = await this.db.executeRef('bundle_index', {
            nSectionid: sectionId,
            nCaseid: caseId,
            pageNumber: 1,
            perPage: INDEX_WINDOW,
            cSearch: tab,
        });
        if (!index.success || !Array.isArray(index.data?.[0])) {
            throw new InternalServerErrorException('Unable to open the document');
        }
        const row = findDocumentRowForReference(index.data[0], tab);
        if (!row) throw new NotFoundException(`No document found for ${tab}`);

        const file = await this.db.rowQuery(RT_DEMO_FILE_SQL, [row.nBundledetailid, sectionId]);
        if (!file.success) throw new InternalServerErrorException('Unable to open the document');
        const f = file.data?.[0];
        if (!f) throw new NotFoundException(`No document found for ${tab}`);

        return {
            cTab: cleanDocumentField(f.cTab) || cleanDocumentField(row.cTab) || tab,
            cName: cleanDocumentField(f.cFilename) || cleanDocumentField(row.cName) || tab,
            cFiletype: cleanDocumentField(f.cFiletype ?? row.cFiletype) || null,
            cPath: cleanDocumentField(f.cPath) || null,
            nPage: query.nPage ?? 1,
            nPageCount: pageCountFromRange(f.cPage),
        };
    }

    /** The chosen source case, or null when none is chosen (or it was archived/deleted). */
    private async sourceCaseId(): Promise<string | null> {
        const res = await this.db.executeRef('rt_sim_source_resolve', {});
        if (!res.success) throw new InternalServerErrorException('Unable to open the document');
        const id = res.data?.[0]?.[0]?.nCaseid;
        return typeof id === 'string' && UUID.test(id) ? id : null;
    }
}
