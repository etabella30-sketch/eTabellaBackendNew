jest.mock('mkdirp', () => ({ sync: jest.fn() }));

import { BadRequestException } from '@nestjs/common';
import * as mkdirp from 'mkdirp';
import { caseUploadDestination, txtOnlyFilter, uploadFilename } from './upload.controller';

const CASE = '33333333-3333-4333-8333-333333333333';

function run(fn: Function, req: any, file: any) {
  const cb = jest.fn();
  fn(req, file, cb);
  return cb.mock.calls[0];
}

describe('upload path inputs', () => {
  it('destination accepts a UUID caseid only', () => {
    expect(run(caseUploadDestination, { body: { caseid: CASE } }, {})).toEqual([null, `./assets/doc/case${CASE}`]);
    for (const bad of ['../../x', '1/../../..', '', undefined]) {
      const [err, dest] = run(caseUploadDestination, { body: { caseid: bad } }, {});
      expect(err).toBeInstanceOf(BadRequestException);
      expect(dest).toBeUndefined();
    }
    expect((mkdirp as any).sync).toHaveBeenCalledTimes(1);
  });

  it('filename keeps the caller-supplied plain name and upper-cases the extension', () => {
    expect(run(uploadFilename, { body: { filename: 'transcript_1726' } }, { originalname: 'a.txt' })).toEqual([null, 'transcript_1726.TXT']);
    expect(run(uploadFilename, { body: { filename: `s_${CASE}` } }, { originalname: 'a.txt' })).toEqual([null, `s_${CASE}.TXT`]);
  });

  it('filename rejects traversal and separators, including in the original-name fallback', () => {
    for (const filename of ['../../main', 'a/b', '..\\x', '.htaccess']) {
      const [err] = run(uploadFilename, { body: { filename } }, { originalname: 'a.txt' });
      expect(err).toBeInstanceOf(BadRequestException);
    }
    const [err] = run(uploadFilename, { body: {} }, { originalname: '../evil.txt' });
    expect(err).toBeInstanceOf(BadRequestException);
  });

  it('only .txt files with a text/plain type are accepted', () => {
    expect(run(txtOnlyFilter, {}, { mimetype: 'text/plain', originalname: 'a.TXT' })).toEqual([null, true]);
    expect(run(txtOnlyFilter, {}, { mimetype: 'text/plain', originalname: 'a.html' })[1]).toBe(false);
    expect(run(txtOnlyFilter, {}, { mimetype: 'text/html', originalname: 'a.txt' })[1]).toBe(false);
  });
});
