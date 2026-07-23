import { EventEmitter } from 'events';

jest.mock('child_process', () => ({
  exec: jest.fn(),
  spawn: jest.fn(),
}));

import { spawn } from 'child_process';
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFNumber } from 'pdf-lib';
import { ExportFileService } from './export-file.service';

type FakeProcess = EventEmitter & {
  stdout: EventEmitter;
  stderr: EventEmitter;
  stdin: { end: jest.Mock };
};

describe('ExportFileService annotation worker', () => {
  let service: any;
  let process: FakeProcess;

  beforeEach(() => {
    jest.clearAllMocks();
    process = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
      stdin: { end: jest.fn() },
    }) as FakeProcess;
    (spawn as unknown as jest.Mock).mockReturnValue(process);

    service = Object.create(ExportFileService.prototype);
    service.pythonV = 'python';
    service.EDIT_FILE_PATH = 'exportfile.py';
    service.config = { get: jest.fn((key: string) => `value-for-${key}`) };
    service.logService = {
      info: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
    };
    service.logger = {
      verbose: jest.fn(),
      error: jest.fn(),
    };
    service.updateProgress = jest.fn().mockResolvedValue(undefined);
    service.startIndexing = jest.fn().mockResolvedValue(undefined);
    service.completeFile = jest.fn().mockResolvedValue(undefined);
  });

  it('streams a large annotation payload over stdin instead of the Windows command line', async () => {
    const jsonData = {
      nExportid: 'export-1',
      nEDid: 'detail-1',
      cStatus: 'I',
      highlights: Array.from({ length: 500 }, (_, index) => ({
        page: index + 1,
        text: 'large annotation payload'.repeat(20),
      })),
    };

    const result = service.editFile([jsonData], 0, jsonData.nExportid, 'user-1', jsonData);
    await Promise.resolve();

    expect(spawn).toHaveBeenCalledWith(
      'python',
      ['exportfile.py', '-'],
      expect.objectContaining({ env: expect.objectContaining({ PYTHONIOENCODING: 'UTF-8' }) }),
    );
    expect(process.stdin.end).toHaveBeenCalledWith(JSON.stringify(jsonData), 'utf8');

    process.emit('close', 1);
    await result;
  });

  it('marks the export failed when the Python process cannot start', async () => {
    const jsonData = {
      nExportid: 'export-2',
      nEDid: 'detail-2',
      cStatus: 'I',
    };

    const result = service.editFile([jsonData], 0, jsonData.nExportid, 'user-2', jsonData);
    await Promise.resolve();
    process.emit('error', Object.assign(new Error('spawn ENAMETOOLONG'), { code: 'ENAMETOOLONG' }));
    await result;

    expect(jsonData.cStatus).toBe('F');
    expect(service.updateProgress).toHaveBeenLastCalledWith(
      jsonData.nExportid,
      'user-2',
      jsonData,
      'F',
    );
  });

  it('counts unique annotations from the actual burn payload', () => {
    const counts = service.getAnnotationCounts(
      {
        highlights: [
          { id: 'fact-range', linktype: 'F', type: 'page-marker', page: 1 },
          { id: 'fact-range', linktype: 'F', type: 'page-marker', page: 2 },
          { id: 'team-qfact-1', linktype: 'QF', type: 'highlight', page: 2 },
          { id: 'team-qfact-2', linktype: 'QF', type: 'highlight', page: 3 },
          { id: 'doc-link-1', linktype: 'D', type: 'highlight', page: 2 },
          { id: 'doc-link-1', linktype: 'D', type: 'page-marker', page: 4 },
        ],
      },
      {
        factlinks: [{ cFType: 'F' }],
        doclinks: [],
      },
    );

    expect(counts).toEqual({ qfact: 2, fact: 1, link: 1 });
  });

  it('collects the exact Fact and DocLink IDs used by the burn payload for the index', () => {
    const ids = service.getAnnotationIds({
      highlights: [
        { id: 'team-qfact-1', nFSid: 'team-qfact-1', linktype: 'QF', page: 3 },
        { id: 'team-qfact-1', nFSid: 'team-qfact-1', linktype: 'QF', page: 3 },
        { id: 'team-fact-1', nFSid: 'team-fact-1', linktype: 'F', page: 4 },
        { id: 'team-doc-1', nDocid: 'team-doc-1', linktype: 'D', page: 5 },
        { id: 'web-1', nWebid: 'web-1', linktype: 'W', page: 6 },
      ],
    });

    expect(ids).toEqual({
      factIds: ['team-qfact-1', 'team-fact-1'],
      docIds: ['team-doc-1'],
    });
  });

  it('replaces an index page link with one normalized shifted destination', async () => {
    const pdfDoc = await PDFDocument.create();
    for (let index = 0; index < 8; index++) pdfDoc.addPage();

    const page = pdfDoc.getPage(0);
    const originalLink = pdfDoc.context.register(
      pdfDoc.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [10, 10, 30, 20],
        Dest: [3, 'XYZ', null, null, null],
      }),
    );
    page.node.set(PDFName.of('Annots'), pdfDoc.context.obj([originalLink]));

    await service.applyInternalLink(
      pdfDoc,
      [{
        page: 1,
        annotation: [{
          subtype: 'Link',
          rect: [10, 10, 30, 20],
          borderColor: new Uint8ClampedArray([0, 0, 0]),
          // pdfjs exposes PDF names as objects. This used to become
          // `/Dest [5 << /name /XYZ >> null null null]` in the final PDF.
          dest: [5, { name: 'XYZ' }, null, null, null],
        }],
      }],
      { factsheets_array: [] },
      jest.fn(),
    );

    // Assert the serialized PDF too; the Acrobat bug only appears after the
    // JavaScript destination object has been written to PDF syntax.
    const reloadedPdf = await PDFDocument.load(await pdfDoc.save());
    const annotations = reloadedPdf.getPage(0).node.lookup(PDFName.of('Annots'), PDFArray);
    expect(annotations.size()).toBe(1);

    const link = annotations.lookup(0, PDFDict);
    const destination = link.lookup(PDFName.of('Dest'), PDFArray);
    expect(destination.lookup(0, PDFNumber).asNumber()).toBe(5);
    expect(destination.get(1).toString()).toBe('/XYZ');
    expect(destination.get(4).toString()).toBe('null');
  });
});
