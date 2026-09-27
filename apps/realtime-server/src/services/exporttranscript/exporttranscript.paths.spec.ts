jest.mock('fs-extra', () => ({
  ...jest.requireActual('fs-extra'),
  pathExists: jest.fn(),
  unlink: jest.fn(),
}));

import * as path from 'path';
import * as fsextra from 'fs-extra';
import { ExporttranscriptService } from './exporttranscript.service';

const BASE = 'assets/realtime-transcripts/';
const EXPORTS = path.resolve(BASE, 'exports');
const ME = '11111111-1111-4111-8111-111111111111';
const TRANS = '77777777-7777-4777-8777-777777777777';
const LEGIT = `s_${TRANS}_FST.html`;

const pathExists = fsextra.pathExists as unknown as jest.Mock;
const unlink = fsextra.unlink as unknown as jest.Mock;

function build() {
  const config = { get: (k: string) => (k === 'REALTIME_PATH' ? BASE : undefined) };
  const transcriptService = {
    getHTMLfile: jest.fn().mockResolvedValue({ msg: 1, html: '<p>t</p>' }),
    savehtmlToFile: jest.fn().mockResolvedValue({ msg: 1 }),
  };
  const kafka = { sendMessage: jest.fn() };
  const svc: any = Object.assign(Object.create(ExporttranscriptService.prototype), { config, transcriptService, kafka });
  const generatePdf = jest.spyOn(svc, 'generatePdf').mockImplementation(async (_html: any, pdf: any) => pdf);
  const convert = jest.spyOn(svc, 'convertPdfToDocxViaPython').mockImplementation(async (_pdf: any, docx: any) => docx);
  const generateDodocx = jest.spyOn(svc, 'generateDodocx');
  return { svc, transcriptService, kafka, generatePdf, convert, generateDodocx };
}

/** Every path handed to unlink stays inside REALTIME_PATH/exports. */
function expectUnlinksInsideExports() {
  for (const [p] of unlink.mock.calls) {
    expect(path.resolve(String(p)).startsWith(EXPORTS + path.sep)).toBe(true);
  }
}

describe('html-file-to-doc-stream path containment', () => {
  beforeEach(() => {
    pathExists.mockReset().mockResolvedValue(true);
    unlink.mockReset().mockResolvedValue(undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it.each(['../../x', '../../.env.production', 'a/../../x', '../../../etc/passwd'])(
    'a client filePath %s never reaches generatePdf or unlink; the server-built s_<cTransid>_FST.html is used',
    async (filePath) => {
      const { svc, generatePdf, generateDodocx } = build();
      await expect(svc.htmlFileToDocStream(ME, filePath, TRANS, 'origin')).resolves.toEqual({ msg: 1, value: 'generation started' });
      await generateDodocx.mock.results[0].value;

      expect(generateDodocx).toHaveBeenCalledWith(ME, LEGIT);
      expect(generatePdf).toHaveBeenCalledTimes(1);
      expect(generatePdf.mock.calls[0][0]).toBe(path.join(EXPORTS, LEGIT));
      expect(unlink).toHaveBeenCalledWith(path.join(EXPORTS, LEGIT));
      expectUnlinksInsideExports();
    },
  );

  it.each(['../../x', 'a/../../x', '..', '', '/etc/passwd', 'C:\\Windows\\win.ini', 'sub/s_1_FST.html'])(
    'generateDodocx refuses %j before any read or unlink',
    async (filePath) => {
      const { svc, generatePdf, convert, kafka } = build();
      await svc.generateDodocx(ME, filePath);
      expect(generatePdf).not.toHaveBeenCalled();
      expect(convert).not.toHaveBeenCalled();
      expect(pathExists).not.toHaveBeenCalled();
      expect(unlink).not.toHaveBeenCalled();
      expect(kafka.sendMessage).toHaveBeenCalledWith('realtime-response', expect.objectContaining({
        data: expect.objectContaining({ data: { status: 'F', error: 'Invalid file path' } }),
      }));
    },
  );

  it('a cTransid that would climb out of exports is refused before any HTML is generated or saved', async () => {
    const { svc, transcriptService, generateDodocx } = build();
    await expect(svc.htmlFileToDocStream(ME, LEGIT, '../../../etc/x', 'origin')).resolves.toEqual({ msg: -1, value: 'Invalid transcript id' });
    expect(transcriptService.getHTMLfile).not.toHaveBeenCalled();
    expect(transcriptService.savehtmlToFile).not.toHaveBeenCalled();
    expect(generateDodocx).not.toHaveBeenCalled();
  });

  it('a legitimate s_<cTransid>_FST.html still renders, converts and cleans up inside exports', async () => {
    const { svc, generatePdf, convert, kafka } = build();
    await svc.generateDodocx(ME, LEGIT);
    expect(generatePdf).toHaveBeenCalledWith(path.join(EXPORTS, LEGIT), expect.stringMatching(/exports[\\/]\d+\.pdf$/), ME);
    expect(convert).toHaveBeenCalledWith(expect.stringMatching(/\d+\.pdf$/), expect.stringMatching(/exports[\\/]\d+\.docx$/), ME);
    expect(unlink).toHaveBeenCalledWith(path.join(EXPORTS, LEGIT));
    expectUnlinksInsideExports();
    expect(kafka.sendMessage).toHaveBeenCalledWith('realtime-response', expect.objectContaining({
      data: expect.objectContaining({ data: expect.objectContaining({ status: 'S', path: expect.stringMatching(/^\d+\.docx$/) }) }),
    }));
  });
});
