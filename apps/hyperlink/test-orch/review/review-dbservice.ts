/**
 * Review check A: does the REAL DbService.executeRef throw on a DB failure
 * (as the S3-2 stub assumes) or return { success:false }?
 * Only connects to 127.0.0.1:1 (nothing listens there). No Redis.
 */
import { DbService } from '@app/global/db/pg/db.service';
import { QueryBuilderService } from '@app/global/db/pg/query-builder.service';
import { ConfigService } from '@nestjs/config';

(async () => {
  const cfg = new ConfigService({ DB_HOST: '127.0.0.1', DB_PORT: '1', DB_USERNAME: 'x', DB_PASSWORD: 'x', DB_DATABASE: 'orchtest', DB_SSL: '0' });
  const db = new DbService(new QueryBuilderService(), cfg);
  let threw = false; let res: any;
  const t = Date.now();
  try {
    res = await db.executeRef('hyperlink_getfiles', { nBundledetailid: null, nBundleid: 'A', nSectionid: 'S', nCaseid: 'c1', cType: 'E', nMasterid: 'm1', cKeeptype: 'R', isDeepscan: false, ref: 2 });
  } catch (e) { threw = true; res = String(e && e.message); }
  console.log(JSON.stringify({ threw, ms: Date.now() - t, res: typeof res === 'object' ? { success: res.success, error: String(res.error && res.error.message || res.error).slice(0, 120) } : res }));
  process.exit(0);
})();
