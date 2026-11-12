import { HyperlinkController } from './hyperlink.controller';
import { HyperlinkService } from './hyperlink.service';
import { GeneratehyperlinkService } from './services/generatehyperlink/generatehyperlink.service';

describe('HyperlinkController', () => {
  it('passes index requests to the index queue', async () => {
    const generator = { starthyperlink: jest.fn().mockResolvedValue({ msg: 1 }) };
    const controller = new HyperlinkController({} as HyperlinkService, generator as unknown as GeneratehyperlinkService);
    const body = { nSectionid: 'section' } as never;
    await expect(controller.indexHyperlink(body)).resolves.toEqual({ msg: 1 });
    expect(generator.starthyperlink).toHaveBeenCalledWith(body, true);
  });
});
