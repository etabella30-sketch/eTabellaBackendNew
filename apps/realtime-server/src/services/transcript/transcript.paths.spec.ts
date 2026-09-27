import * as fs from 'fs';
import * as path from 'path';
import { BadRequestException } from '@nestjs/common';
import { TranscriptService } from './transcript.service';
import { TranscriptpublishService } from './transcript_publish.service';
import { ExporttranscriptService } from '../exporttranscript/exporttranscript.service';
import { GenerateWordIndexService } from '../exporttranscript/generate_word_index/generate_word_index.service';

const BASE = 'assets/realtime-transcripts/';
const config = { get: (k: string) => (k === 'REALTIME_PATH' ? BASE : undefined) } as any;
const log = { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn(), report: jest.fn() } as any;
const TRANS = '77777777-7777-4777-8777-777777777777';

describe('transcript cPath containment', () => {
  let readFileSync: jest.SpyInstance;
  let existsSync: jest.SpyInstance;

  beforeEach(() => {
    readFileSync = jest.spyOn(fs, 'readFileSync');
    existsSync = jest.spyOn(fs, 'existsSync');
  });
  afterEach(() => jest.restoreAllMocks());

  const transcript = () => new TranscriptService(config, {} as any, log, {} as any);

  it.each(['../../etabella-firebase.json', '../.env.production', 'a/../../x.json'])('summary / filedata / convert refuse %s without reading it', async (cPath) => {
    expect(transcript().getTranscriptSummary({ cPath })).toEqual({ msg: -1, value: 'Invalid transcript path' });
    expect(transcript().getTranscriptFiledata({ cPath })).toEqual({ msg: -1, message: 'Invalid transcript path' });
    await expect(transcript().ConvertTextToJosn({ cPath } as any)).resolves.toEqual({ msg: -1, value: 'Invalid transcript path' });
    expect(readFileSync).not.toHaveBeenCalled();
  });

  it('a read error does not echo the file path back', () => {
    readFileSync.mockImplementation(() => { throw new Error(`ENOENT: no such file or directory, open '/srv/app/${BASE}missing.json'`); });
    const res: any = transcript().getTranscriptFiledata({ cPath: 'missing.json' });
    expect(JSON.stringify(res)).not.toContain('/srv/app');
  });

  it('publish refuses a cPath outside REALTIME_PATH and never names the server path', async () => {
    const svc: any = Object.assign(Object.create(TranscriptpublishService.prototype), { config, log, logTag: 'spec' });
    const bad = await svc.transcriptPublish({ cPath: '../../etc/passwd', cTransid: 't1', nSesid: null }, '');
    expect(bad).toEqual(expect.objectContaining({ msg: -1, value: 'Invalid transcript path' }));
    expect(existsSync).not.toHaveBeenCalled();

    existsSync.mockReturnValue(false);
    const missing = await svc.transcriptPublish({ cPath: 'transcript_1.TXT', cTransid: 't1', nSesid: null }, '');
    expect(missing.value).toBe('Transcript file not found: transcript_1.TXT');
    expect(missing.value).not.toContain(BASE);
  });

  it('download serves only files under REALTIME_PATH/exports', () => {
    const svc: any = Object.assign(Object.create(ExporttranscriptService.prototype), { config, log });
    const res: any = { status: jest.fn(() => res), send: jest.fn(() => res), download: jest.fn() };
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    svc.downloadFile('../../.env.production', res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.download).not.toHaveBeenCalled();

    svc.downloadFile('report.pdf', res);
    expect(res.download).toHaveBeenCalledWith(expect.stringMatching(/exports[\\/]report\.pdf$/), 'report.pdf', expect.any(Function));
  });

  describe('generate-file-index', () => {
    const wordIndex = () => {
      const db = { executeRef: jest.fn().mockResolvedValue({ success: true, data: [[{ cTransid: TRANS }]] }) };
      return { svc: new GenerateWordIndexService(config, log, {} as any, db as any), db };
    };

    it.each(['../../etabella-firebase.json', '../data/dt_1/feed.json', 'a/../../x.json', '/etc/passwd', ''])(
      'refuses cPath %j without reading it or querying the transcript',
      async (cPath) => {
        const { svc, db } = wordIndex();
        await expect(svc.generateIndex(cPath, TRANS)).rejects.toBeInstanceOf(BadRequestException);
        expect(readFileSync).not.toHaveBeenCalled();
        expect(db.executeRef).not.toHaveBeenCalled();
      },
    );

    it('reads a transcript JSON inside REALTIME_PATH', async () => {
      jest.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined);
      readFileSync.mockImplementation(() => { throw new Error('stop after the read'); });
      const { svc } = wordIndex();
      await svc.generateIndex('transcript_1.json', TRANS);
      expect(readFileSync).toHaveBeenCalledWith(path.resolve(BASE, 'transcript_1.json'), 'utf-8');
    });

    it('a read error does not echo the server path in the response body', async () => {
      jest.spyOn(fs, 'unlinkSync').mockImplementation(() => undefined);
      readFileSync.mockImplementation(() => { throw new Error(`ENOENT: no such file or directory, open '/srv/app/${BASE}missing.json'`); });
      const { svc } = wordIndex();
      const body = (await svc.generateIndex('missing.json', TRANS)).toString('utf-8');
      expect(body).toBe('Error generating index');
      expect(body).not.toContain('/srv/app');
    });
  });
});
