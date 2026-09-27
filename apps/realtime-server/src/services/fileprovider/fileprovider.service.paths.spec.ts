import * as os from 'os';
import * as path from 'path';
import { FileproviderService } from './fileprovider.service';

function makeRes() {
  const res: any = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.set = jest.fn(() => res);
  return res;
}

describe('FileproviderService.provideFile', () => {
  const assets = path.join(os.tmpdir(), 'rt-fileprovider-spec-nonexistent');
  const svc = new FileproviderService({ get: () => assets } as any);

  beforeEach(() => jest.spyOn(console, 'log').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it('rejects a non-UUID nSesid with 400', () => {
    const res = makeRes();
    svc.provideFile({ nSesid: '../../../etc/passwd' }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('answers a missing file with 404 and no server path in the body', () => {
    const res = makeRes();
    svc.provideFile({ nSesid: '000b14bd-7494-4908-9eab-a2fe0defb666' }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    const body = res.json.mock.calls[0][0];
    expect(body).toEqual({ msg: -1, value: 'File not found' });
    expect(JSON.stringify(body)).not.toContain(assets);
  });
});
