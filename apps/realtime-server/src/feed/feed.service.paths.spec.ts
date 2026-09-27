import { BadRequestException } from '@nestjs/common';
import { FeedService } from './feed.service';

describe('FeedService session id validation', () => {
  const feedData = { checkSessionExists: jest.fn(() => false) };
  const svc = new FeedService(feedData as any, { get: () => 'assets/realtime-transcripts/' } as any);

  beforeEach(() => feedData.checkSessionExists.mockClear());

  it('pages/total refuses a non-UUID nSesid before touching memory or disk', async () => {
    await expect(svc.getTotalPages({ nSesid: '../../etc' })).resolves.toEqual({ msg: -1, total: 0 });
    expect(feedData.checkSessionExists).not.toHaveBeenCalled();
  });

  it('pages/data refuses a non-UUID nSesid with 400, for both feed and transcript reads', async () => {
    await expect(svc.getFeedData({ nSesid: '../../etc', pages: [1], bTranscript: false })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.getFeedData({ nSesid: '..\\..\\x', pages: [1], bTranscript: true })).rejects.toBeInstanceOf(BadRequestException);
    expect(feedData.checkSessionExists).not.toHaveBeenCalled();
  });
});
