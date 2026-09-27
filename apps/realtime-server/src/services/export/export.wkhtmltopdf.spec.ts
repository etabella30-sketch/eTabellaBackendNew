jest.mock('child_process', () => {
  const actual = jest.requireActual('child_process');
  return { ...actual, exec: jest.fn((cmd: string, cb: (err: any, out?: any) => void) => cb(null, { stdout: '', stderr: '' })) };
});

import { exec } from 'child_process';
import { ExportService } from './export.service';
import { ExporttranscriptService } from '../exporttranscript/exporttranscript.service';
import { GenerateWordIndexService } from '../exporttranscript/generate_word_index/generate_word_index.service';

/*
 * wkhtmltopdf renders export HTML built from request fields and stored text. It must not run
 * script or read local files other than the page (the templates need neither); without these
 * flags an injected <iframe src="file:///..."> would be printed into the PDF.
 */
const commands = () => (exec as unknown as jest.Mock).mock.calls.map((c) => String(c[0]));
const expectLockedDown = (cmd: string) => {
  expect(cmd).toMatch(/^wkhtmltopdf /);
  expect(cmd).toContain('--disable-local-file-access');
  expect(cmd).toContain('--disable-javascript');
  expect(cmd).not.toContain('--enable-local-file-access');
};

describe('wkhtmltopdf renders run without script or local file access', () => {
  beforeEach(() => (exec as unknown as jest.Mock).mockClear());

  it('issue/annothighlightexport (ExportService.generatePdfWithWkhtml)', async () => {
    const svc = Object.assign(Object.create(ExportService.prototype), { config: { get: () => 'assets/realtime-transcripts/' } }) as ExportService;
    await expect(svc.generatePdfWithWkhtml({ nSessionid: '11111111-1111-4111-8111-111111111111' } as any)).resolves.toBe('s_11111111-1111-4111-8111-111111111111.pdf');
    expect(commands()).toHaveLength(1);
    expectLockedDown(commands()[0]);
  });

  it('legacy exporttranscript and word-index converters', async () => {
    const log = { report: jest.fn() };
    await Object.assign(Object.create(ExporttranscriptService.prototype), { log }).convertHtmlToPdf('x/exports/a.html', 'x/exports/a.pdf');
    await Object.assign(Object.create(GenerateWordIndexService.prototype), { log }).convertHtmlToPdf('x/exports/b.html', 'x/exports/b.pdf');
    expect(commands()).toHaveLength(2);
    commands().forEach(expectLockedDown);
  });
});
