import { ForbiddenException } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

describe('ExportController', () => {
  it('does not open a file for an invalid export path', async () => {
    const service = { downloadFile: jest.fn() };
    const db = { rowQuery: jest.fn() };
    const controller = new ExportController(service as unknown as ExportService, db as unknown as DbService);
    const logged = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      await expect(controller.downloadFile({ nMasterid: 'bad-user', cPath: '../secret' } as never, {} as never)).rejects.toBeInstanceOf(ForbiddenException);
      expect(db.rowQuery).not.toHaveBeenCalled();
      expect(service.downloadFile).not.toHaveBeenCalled();
    } finally { logged.mockRestore(); }
  });
});
