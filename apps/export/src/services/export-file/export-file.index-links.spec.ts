import { ExportFileService } from './export-file.service';

/** Document Reader QA report 2026-10-26, export defects:
 *  DR-013 a two-digit section count wrapped one digit per line;
 *  DR-014 a legacy mark with page 0 exported as "0" and linked onto an index page;
 *  DR-015 a DocLink into ANOTHER document became a local page link into this one. */
function service(webAppUrl = ''): any {
  const svc: any = Object.create(ExportFileService.prototype);
  svc.configService = { get: jest.fn((key: string) => (key === 'WEB_APP_URL' ? webAppUrl : '')) };
  svc.logService = { info: jest.fn(), log: jest.fn(), error: jest.fn() };
  svc.logger = { verbose: jest.fn(), error: jest.fn() };
  // Design tokens are an instance field, absent on a bare prototype.
  svc.IDX = {
    navy: '#002f64', ink: '#12233f', ink2: '#2a3a55', mute: '#5b6b85', mute2: '#8b99b2',
    line: '#e1eaf6', line2: '#eef3fb', paper: '#f6f9ff', thead: '#eef2f8',
    accent: '#0066ff', link: '#c2570f', rowAlt: '#fbfcfe',
  };
  return svc;
}

describe('ExportFileService annotation index: section count badge (DR-013)', () => {
  it('gives the count badge a fixed width that grows with its digits and never wraps', () => {
    const svc = service();

    const one = svc.idxSectionHead('F', 8);
    const two = svc.idxSectionHead('QF', 11);
    const three = svc.idxSectionHead('D', 100);

    expect(one.table.widths[1]).toBe(23);
    expect(two.table.widths[1]).toBe(30);
    expect(three.table.widths[1]).toBe(37);
    expect(two.table.body[0][1]).toEqual(expect.objectContaining({ text: '11', noWrap: true }));
  });
});

describe('ExportFileService annotation index: source page (DR-014)', () => {
  it('reads a positive page from jLinktype, then nPage, then the burned page, then cPage', () => {
    const svc = service();

    expect(svc.idxPageStart({ jLinktype: { pages: [4, 6] }, nPage: 2 })).toBe('4');
    expect(svc.idxPageStart({ jLinktype: { start: 3, end: 5 }, nPage: 2 })).toBe('3');
    expect(svc.idxPageStart({ nPage: 2 })).toBe('2');
    expect(svc.idxPageStart({ nPage: 0, nBurnPage: 2 })).toBe('2');
    expect(svc.idxPageStart({ jLinktype: { start: 0, end: 0 }, nPage: '0', cPage: '7-9' })).toBe('7');
  });

  it('refuses 0, blanks and junk as a page, so the row shows a dash and carries no link', () => {
    const svc = service();

    expect(svc.idxPageStart({ nPage: 0 })).toBe('');
    expect(svc.idxPageStart({ nPage: '', cPage: '' })).toBe('');
    expect(svc.idxPageText({ nPage: 0 })).toBe('—');
    expect(svc.getPageno('0')).toBe(0);
    expect(svc.getPageno('')).toBe(0);
    expect(svc.getPageno('abc')).toBe(0);
    expect(svc.getPageno('2')).toBe('2');
    expect(svc.getPageno('2-5')).toBe('2');
    expect(svc.getPageno('3,7')).toBe('3');

    const table = svc.idxRowsTable([{ nFSid: 'f1', nPage: 0, cFType: 'QF' }], 'QF');
    const pageCell = table.table.body[0][0].stack[0];
    expect(pageCell.text).toBe('—');
    expect(pageCell.linkToPage).toBeUndefined();
  });

  it('carries the burned page of each mark onto its index row', () => {
    const svc = service();
    const burn = svc.burnPagesById({
      highlights: [
        { nFSid: 'legacy', linktype: 'QF', page: 3 },
        { nFSid: 'legacy', linktype: 'QF', page: 2 },
        { nDocid: 'dl', linktype: 'D', page: 5 },
        { nFSid: 'bad', linktype: 'F', page: 0 },
      ],
    });

    expect(burn.get('legacy')).toBe(2);
    expect(burn.get('dl')).toBe(5);
    expect(burn.has('bad')).toBe(false);
    expect(svc.withBurnPages([{ nFSid: 'legacy', nPage: 0 }, { nFSid: 'other', nPage: 4 }], 'nFSid', burn)).toEqual([
      { nFSid: 'legacy', nPage: 0, nBurnPage: 2 },
      { nFSid: 'other', nPage: 4 },
    ]);
  });
});

describe('ExportFileService annotation index: DocLink destinations (DR-015)', () => {
  const exported = { nBundledetailid: 'bd-a1', nCaseid: 'case-1' };
  const sameDoc = { nBundledetailid: 'bd-a1', cTab: 'A1', cBundletag: 'A', jLinktype: { start: 7, end: 8 } };
  const otherDoc = { nBundledetailid: 'bd-b1', cTab: 'B1', cBundletag: 'B', jLinktype: { start: 7, end: 8 }, cExhibitno: 'B1' };

  it('keeps a local page link when the destination is the exported document', () => {
    const svc = service();

    const [node] = svc.genlinkpage(sameDoc, svc.linkTarget(sameDoc, exported));

    expect(node).toEqual(expect.objectContaining({ text: '7–8', linkToPage: '7' }));
  });

  it('never points a B1 destination into the A1 output: a Reader deep link when the web app URL is set', () => {
    const svc = service('https://app.example.test/');

    const content = svc.getlinkdocs([otherDoc], exported);
    const node = content[0].text[1].text[0];

    expect(node.linkToPage).toBeUndefined();
    expect(node.link).toBe('https://app.example.test/reader?docId=bd-b1&caseId=case-1&page=7');
    expect(content[2].text).toBe('In another document — opens in the Reader');
  });

  it('falls back to plain text for another document when no web app URL is configured', () => {
    const svc = service();

    const content = svc.getlinkdocs([otherDoc], exported);
    const node = content[0].text[1].text[0];

    expect(node).toEqual({ text: '7–8', style: 'tableRowEven' });
    expect(content[2].text).toBe('In another document — not part of this export');
  });

  it('treats every destination as local without an export context (legacy callers)', () => {
    const svc = service();

    const [node] = svc.genlinkpage(otherDoc);

    expect(node.linkToPage).toBe('7');
  });
});
